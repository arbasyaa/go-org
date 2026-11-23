package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// ErrInvitationConverted menandai undangan yang sudah punya Event. Route
// menerjemahkannya jadi 409, bukan 500.
var ErrInvitationConverted = errors.New("undangan sudah dikonversi menjadi event")

// ErrInvalidPDF menandai lampiran yang bukan PDF sungguhan.
var ErrInvalidPDF = errors.New("lampiran harus berupa berkas PDF")

// Batas ukuran lampiran undangan. Form publik, jadi sengaja lebih ketat dari
// lampiran internal (surat/announcement).
const InvitationMaxAttachmentBytes = 5 << 20 // 5 MB

type InvitationService struct{}

// ---------------------------------------------------------------------------
// Submit publik
// ---------------------------------------------------------------------------

type InvitationSubmitInput struct {
	OrganizationName string
	EventName        string
	EventDate        time.Time
	Attachment       []byte
	AttachmentName   string
	// AttachmentURL diisi route setelah berkas diunggah ke storage.
	AttachmentURL string
	SubmittedIP   string
}

// SubmitPublic menyimpan undangan dari form publik. Validasi dilakukan di sini
// (bukan hanya di route) supaya aturan yang sama berlaku untuk pemanggil lain.
func (InvitationService) SubmitPublic(ctx context.Context, in InvitationSubmitInput) (*models.Invitation, error) {
	orgName := strings.TrimSpace(in.OrganizationName)
	eventName := strings.TrimSpace(in.EventName)
	if orgName == "" {
		return nil, fmt.Errorf("nama himpunan wajib diisi")
	}
	if eventName == "" {
		return nil, fmt.Errorf("nama acara wajib diisi")
	}
	if len(orgName) > 150 {
		return nil, fmt.Errorf("nama himpunan maksimal 150 karakter")
	}
	if len(eventName) > 200 {
		return nil, fmt.Errorf("nama acara maksimal 200 karakter")
	}
	if in.EventDate.IsZero() {
		return nil, fmt.Errorf("tanggal acara wajib diisi")
	}
	if len(in.Attachment) == 0 {
		return nil, fmt.Errorf("lampiran PDF wajib diunggah")
	}
	if len(in.Attachment) > InvitationMaxAttachmentBytes {
		return nil, fmt.Errorf("lampiran maksimal 5 MB")
	}
	if !IsPDF(in.Attachment) {
		return nil, ErrInvalidPDF
	}

	return orm.Create(ctx, &models.Invitation{
		OrganizationName: orgName,
		EventName:        eventName,
		EventDate:        dateOnly(in.EventDate),
		AttachmentURL:    in.AttachmentURL,
		AttachmentName:   sanitizeFileName(in.AttachmentName),
		AttachmentSize:   int64(len(in.Attachment)),
		Status:           "submitted",
		SubmittedIP:      in.SubmittedIP,
	})
}

// IsPDF memeriksa magic bytes, bukan ekstensi atau MIME dari browser: keduanya
// dikirim klien dan mudah dipalsukan. Berkas non-PDF yang dinamai .pdf tetap
// ditolak di sini.
func IsPDF(data []byte) bool {
	if len(data) < 5 {
		return false
	}
	return string(data[:5]) == "%PDF-"
}

var unsafeFileName = regexp.MustCompile(`[^A-Za-z0-9._-]+`)

// sanitizeFileName membuang path dan karakter aneh dari nama file kiriman
// publik, supaya tidak bisa dipakai untuk path traversal di Content-Disposition.
func sanitizeFileName(name string) string {
	base := name
	if i := strings.LastIndexAny(base, `/\`); i >= 0 {
		base = base[i+1:]
	}
	base = unsafeFileName.ReplaceAllString(base, "_")
	base = strings.Trim(base, "._")
	if base == "" {
		base = "undangan.pdf"
	}
	if len(base) > 200 {
		base = base[:200]
	}
	if !strings.HasSuffix(strings.ToLower(base), ".pdf") {
		base += ".pdf"
	}
	return base
}

// dateOnly membuang komponen jam: undangan hanya butuh tanggal berlangsung.
//
// Zona waktu sengaja memakai WIB (bukan UTC). Undangan hanya menyebut tanggal,
// jadi tengah malam harus jatuh di tengah malam WIB — kalau disimpan sebagai
// 00:00 UTC, di browser WIB tanggalnya bergeser jadi 07:00 dan tanggal selesai
// ikut melompat ke hari berikutnya.
func dateOnly(t time.Time) time.Time {
	loc := jakartaLocation()
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc)
}

// jakartaLocation: WIB (UTC+7) tanpa bergantung pada tzdata sistem, supaya
// perilakunya sama di mesin dev, container, dan server produksi.
func jakartaLocation() *time.Location {
	if loc, err := time.LoadLocation("Asia/Jakarta"); err == nil {
		return loc
	}
	return time.FixedZone("WIB", 7*60*60)
}

// ---------------------------------------------------------------------------
// Rate limit form publik (in-memory)
// ---------------------------------------------------------------------------

// ipLimiter membatasi kiriman form publik per IP. In-memory, jadi
// hanya akurat untuk satu instance backend — lihat PONYTAIL-DEBT.md untuk
// trigger pindah ke Redis saat backend di-scale.
type ipLimiter struct {
	mu      sync.Mutex
	hits    map[string][]time.Time
	max     int
	window  time.Duration
	lastGC  time.Time
	gcEvery time.Duration
}

var publicInvitationLimiter = &ipLimiter{
	hits:    map[string][]time.Time{},
	max:     5,
	window:  time.Hour,
	gcEvery: 10 * time.Minute,
}

// Allow mencatat satu kiriman dan mengembalikan false kalau kuota habis.
func (l *ipLimiter) Allow(key string) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()

	// Bersihkan entri kedaluwarsa sesekali supaya map tidak tumbuh tanpa batas
	// dari IP yang datang sekali lalu hilang.
	if now.Sub(l.lastGC) > l.gcEvery {
		for k, times := range l.hits {
			kept := times[:0]
			for _, t := range times {
				if now.Sub(t) < l.window {
					kept = append(kept, t)
				}
			}
			if len(kept) == 0 {
				delete(l.hits, k)
				continue
			}
			l.hits[k] = kept
		}
		l.lastGC = now
	}

	kept := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if now.Sub(t) < l.window {
			kept = append(kept, t)
		}
	}
	if len(kept) >= l.max {
		l.hits[key] = kept
		return false
	}
	l.hits[key] = append(kept, now)
	return true
}

// AllowPublicInvitationSubmit dipakai route publik sebelum menyimpan apa pun.
func AllowPublicInvitationSubmit(ip string) bool {
	return publicInvitationLimiter.Allow(ip)
}

// ResetPublicInvitationLimiter hanya untuk test.
func ResetPublicInvitationLimiter() {
	publicInvitationLimiter.mu.Lock()
	defer publicInvitationLimiter.mu.Unlock()
	publicInvitationLimiter.hits = map[string][]time.Time{}
	publicInvitationLimiter.lastGC = time.Time{}
}

// ---------------------------------------------------------------------------
// Baca
// ---------------------------------------------------------------------------

// List mengembalikan semua undangan terbaru dulu, lengkap dengan ringkasan
// event hasil konversi (kalau sudah ada).
func (InvitationService) List(ctx context.Context) ([]map[string]any, error) {
	list, err := orm.Objects[models.Invitation](ctx).OrderBy("-id").All()
	if err != nil {
		return nil, err
	}
	return enrichInvitations(ctx, list)
}

func (InvitationService) Get(ctx context.Context, id int64) (map[string]any, error) {
	inv, err := orm.GetByID[models.Invitation](ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	items, err := enrichInvitations(ctx, []*models.Invitation{inv})
	if err != nil {
		return nil, err
	}
	return items[0], nil
}

func (InvitationService) GetModel(ctx context.Context, id int64) (*models.Invitation, error) {
	inv, err := orm.GetByID[models.Invitation](ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return inv, nil
}

// enrichInvitations menambahkan ringkasan `event` hasil konversi ke setiap baris.
// Daftar peserta TIDAK di sini: penugasan milik event (lihat EventService.Assignees).
func enrichInvitations(ctx context.Context, list []*models.Invitation) ([]map[string]any, error) {
	eventCache := map[int64]*models.Event{}
	out := make([]map[string]any, len(list))

	for i, inv := range list {
		raw, err := json.Marshal(inv)
		if err != nil {
			return nil, err
		}
		item := map[string]any{}
		if err := json.Unmarshal(raw, &item); err != nil {
			return nil, err
		}

		if inv.EventID != nil {
			e, ok := eventCache[*inv.EventID]
			if !ok {
				if found, err := orm.GetByID[models.Event](ctx, *inv.EventID); err == nil {
					e = found
					eventCache[found.ID] = found
				}
			}
			if e != nil {
				item["event"] = map[string]any{
					"id":         e.ID,
					"title":      e.Title,
					"start_time": e.StartTime,
					"end_time":   e.EndTime,
					"status":     e.Status,
				}
			}
		}
		out[i] = item
	}
	return out, nil
}

// ---------------------------------------------------------------------------
// Konversi ke Event
// ---------------------------------------------------------------------------

// Convert membuat Event dari undangan. Idempoten: undangan yang sudah punya
// event ditolak dengan ErrInvitationConverted.
//
// Audience sengaja "all": undangan berlaku untuk seluruh wilayah, dan
// validateAudience menolak "custom" tanpa target. Dengan "all",
// eventIncludesUser mengembalikan true untuk semua user sehingga event
// langsung tampil di kalender setiap anggota tanpa perlu daftar target.
func (InvitationService) Convert(ctx context.Context, invitationID, createdBy int64) (*models.Invitation, *models.Event, error) {
	inv, err := orm.GetByID[models.Invitation](ctx, invitationID)
	if err != nil {
		return nil, nil, ErrNotFound
	}
	if inv.EventID != nil {
		return nil, nil, ErrInvitationConverted
	}

	// event_date adalah kolom DATE: saat dibaca balik, ORM mengembalikannya
	// sebagai tengah malam UTC. Normalisasi lagi ke tengah malam WIB, kalau
	// tidak tanggalnya bergeser jadi 07:00 di browser pengguna.
	start := dateOnly(inv.EventDate)
	if start.IsZero() {
		return nil, nil, fmt.Errorf("tanggal acara belum diisi")
	}

	// AllDay: undangan hanya menyebut tanggal, jadi event-nya tidak berjam.
	// StartTime sudah tengah malam WIB (lihat dateOnly); EndTime dibiarkan
	// kosong supaya EventService mengisi penghujung hari yang sama.
	event, err := EventService{}.Create(ctx, &models.Event{
		Title:       inv.EventName,
		Description: fmt.Sprintf("Delegasi %s. Diundang oleh %s.", "PERMIKOMNAS Jawa Tengah", inv.OrganizationName),
		Location:    inv.OrganizationName,
		StartTime:   start,
		AllDay:      true,
		Audience:    "all",
		CreatedByID: &createdBy,
	}, nil, nil)
	if err != nil {
		return nil, nil, err
	}

	if _, err := orm.UpdateByID[models.Invitation](ctx, inv.ID, map[string]any{
		"event_id": event.ID,
		"status":   "converted",
	}); err != nil {
		return nil, nil, err
	}

	updated, err := orm.GetByID[models.Invitation](ctx, inv.ID)
	if err != nil {
		return nil, nil, err
	}
	return updated, event, nil
}

// Delete menghapus undangan beserta penugasannya (cascade di DB) dan objek
// lampirannya di storage (best-effort, sama seperti pola domain lain).
func (InvitationService) Delete(ctx context.Context, id int64) (*models.Invitation, error) {
	if _, err := orm.GetByID[models.Invitation](ctx, id); err != nil {
		return nil, ErrNotFound
	}
	return orm.DeleteByID[models.Invitation](ctx, id)
}
