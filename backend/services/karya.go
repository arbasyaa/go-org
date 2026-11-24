package services

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
)

// Karya: showcase repositori anggota. Pengajuan datang tanpa login, dikurasi
// admin, lalu tayang di /karya. Desain lengkap ada di
// docs/superpowers/specs/2026-11-23-karya-showcase-design.md
const (
	// KaryaTermsVersion naik setiap isi S&K berubah, supaya kiriman lama tetap
	// menyimpan versi teks yang benar-benar disetujui pengirimnya.
	KaryaTermsVersion   = "2026-11-23"
	KaryaMinAboutChars  = 50
	KaryaMaxAboutChars  = 20000
	KaryaMaxTitleChars  = 150
	KaryaMaxAuthorChars = 150
	KaryaMaxNoteChars   = 500
	// Satu foto wajib (kartu tanpa gambar terlihat seperti daftar tautan),
	// maksimal lima supaya unggahan tetap ringan.
	KaryaMinImages = 1
	KaryaMaxImages = 5
)

// ErrKaryaNotFound dipakai handler untuk membedakan 404 dari kesalahan lain.
var ErrKaryaNotFound = errors.New("karya tidak ditemukan")

// karyaStatuses menjaga handler admin tidak menulis status sembarang ke DB.
var karyaStatuses = map[string]bool{"review": true, "published": true, "rejected": true}

type KaryaService struct{}

// KaryaSubmitInput = isi form pengajuan. ImageURLs diisi route setelah setiap
// gambar divalidasi dan diunggah, bukan dikirim mentah oleh klien.
type KaryaSubmitInput struct {
	Title      string
	AuthorName string
	HimpunanID int64
	RepoURL    string
	AboutMD    string
	ImageURLs  []string
}

// KaryaView = bentuk yang dikirim ke klien publik.
type KaryaView struct {
	ID         int64    `json:"id"`
	Code       string   `json:"code"`
	Title      string   `json:"title"`
	AuthorName string   `json:"author_name"`
	Himpunan   string   `json:"himpunan"`
	HimpunanID int64    `json:"himpunan_id"`
	RepoURL    string   `json:"repo_url"`
	Images     []string `json:"images"`
	AboutHTML  string   `json:"about_html,omitempty"`
	// AboutMD hanya diisi untuk admin (halaman kurasi), tidak untuk publik.
	AboutMD     string     `json:"about_md,omitempty"`
	Status      string     `json:"status"`
	ReviewNote  string     `json:"review_note,omitempty"`
	LikeCount   int        `json:"like_count"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

// Tanpa html.WithUnsafe(): tag HTML yang diketik pengirim keluar sebagai teks,
// sehingga HTML hasil render seluruhnya buatan goldmark sendiri.
var karyaMarkdown = goldmark.New(goldmark.WithExtensions(extension.GFM))

var reAnchorHref = regexp.MustCompile(`<a href="`)

// RenderKaryaMarkdown mengubah markdown kiriman publik menjadi HTML yang aman.
// Dua lapis: goldmark tanpa raw HTML, lalu SanitizeHTML untuk membuang URL
// javascript:/data: dan atribut on* yang lolos lewat markdown.
func RenderKaryaMarkdown(md string) string {
	var buf bytes.Buffer
	if err := karyaMarkdown.Convert([]byte(md), &buf); err != nil {
		return ""
	}
	out := SanitizeHTML(buf.String())
	return reAnchorHref.ReplaceAllString(out, `<a target="_blank" rel="nofollow noopener ugc" href="`)
}

// ---------------------------------------------------------------------------
// Validasi
// ---------------------------------------------------------------------------

var reRepoPath = regexp.MustCompile(`^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$`)

// NormalizeRepoURL hanya menerima https://github.com/<owner>/<repo> dan
// mengembalikan bentuk kanoniknya. Tidak ada request keluar ke URL kiriman:
// mengambil metadata repo berarti server dijadikan proxy untuk URL sembarang
// yang dikirim anonim (SSRF).
func NormalizeRepoURL(raw string) (string, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return "", fmt.Errorf("link repo wajib diisi")
	}
	u, err := url.Parse(s)
	if err != nil {
		return "", fmt.Errorf("link repo tidak valid")
	}
	if u.Scheme != "https" {
		return "", fmt.Errorf("link repo harus diawali https://")
	}
	if !strings.EqualFold(u.Hostname(), "github.com") || u.Port() != "" || u.User != nil {
		return "", fmt.Errorf("link repo harus menunjuk ke github.com")
	}
	if u.RawQuery != "" || u.Fragment != "" {
		return "", fmt.Errorf("link repo tidak boleh memuat query atau fragmen")
	}
	path := strings.Trim(strings.TrimSuffix(u.Path, "/"), "/")
	path = strings.TrimSuffix(path, ".git")
	if !reRepoPath.MatchString(path) {
		return "", fmt.Errorf("link repo harus berbentuk github.com/pengguna/repositori")
	}
	return "https://github.com/" + path, nil
}

func (in KaryaSubmitInput) validate() (KaryaSubmitInput, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.AuthorName = strings.TrimSpace(in.AuthorName)
	in.AboutMD = strings.TrimSpace(in.AboutMD)

	if n := len([]rune(in.Title)); n < 3 || n > KaryaMaxTitleChars {
		return in, fmt.Errorf("nama karya harus 3-%d karakter", KaryaMaxTitleChars)
	}
	if n := len([]rune(in.AuthorName)); n < 3 || n > KaryaMaxAuthorChars {
		return in, fmt.Errorf("nama pengirim harus 3-%d karakter", KaryaMaxAuthorChars)
	}
	if in.HimpunanID <= 0 {
		return in, fmt.Errorf("asal himpunan wajib dipilih")
	}
	if n := len([]rune(in.AboutMD)); n < KaryaMinAboutChars || n > KaryaMaxAboutChars {
		return in, fmt.Errorf("tentang karya harus %d-%d karakter", KaryaMinAboutChars, KaryaMaxAboutChars)
	}
	if n := len(in.ImageURLs); n < KaryaMinImages || n > KaryaMaxImages {
		return in, fmt.Errorf("foto karya harus %d-%d gambar", KaryaMinImages, KaryaMaxImages)
	}
	url, err := NormalizeRepoURL(in.RepoURL)
	if err != nil {
		return in, err
	}
	in.RepoURL = url
	return in, nil
}

// ---------------------------------------------------------------------------
// Kode pelacakan
// ---------------------------------------------------------------------------

// Tanpa 0/O/1/I: kode dibacakan orang lewat pesan, bukan disalin.
const karyaAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func newKaryaCode() (string, error) {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i, v := range b {
		b[i] = karyaAlphabet[int(v)%len(karyaAlphabet)]
	}
	return "KRY-" + string(b), nil
}

// ---------------------------------------------------------------------------
// Tulis
// ---------------------------------------------------------------------------

// Submit menyimpan pengajuan baru berstatus review dan mengembalikan kode
// pelacakannya. Kode dibuat acak, jadi tabrakan dicoba ulang beberapa kali.
func (KaryaService) Submit(ctx context.Context, in KaryaSubmitInput) (*models.Karya, error) {
	in, err := in.validate()
	if err != nil {
		return nil, err
	}
	if _, err := orm.GetByID[models.Himpunan](ctx, in.HimpunanID); err != nil {
		return nil, fmt.Errorf("himpunan tidak ditemukan")
	}
	now := time.Now()
	m := &models.Karya{
		Title: in.Title, AuthorName: in.AuthorName,
		HimpunanID: in.HimpunanID, RepoURL: in.RepoURL,
		AboutMD:      in.AboutMD,
		Status:       "review",
		TermsVersion: KaryaTermsVersion, TermsAcceptedAt: &now,
	}
	for attempt := 0; attempt < 5; attempt++ {
		code, err := newKaryaCode()
		if err != nil {
			return nil, err
		}
		m.Code = code
		existing, err := orm.Objects[models.Karya](ctx).Filter("code", code).First()
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return nil, err
		}
		if existing != nil {
			continue
		}
		created, err := orm.Create(ctx, m)
		if err != nil {
			return nil, err
		}
		for i, url := range in.ImageURLs {
			if _, err := orm.Create(ctx, &models.KaryaImage{
				KaryaID: created.ID, URL: url, SortOrder: i,
			}); err != nil {
				return nil, err
			}
		}
		return created, nil
	}
	return nil, fmt.Errorf("gagal membuat kode karya, coba lagi")
}

// Review mengubah status kiriman. Publish mengisi published_at, rejected
// mengosongkannya supaya karya yang diturunkan hilang dari daftar publik.
func (KaryaService) Review(ctx context.Context, id int64, status, note string) (*models.Karya, error) {
	status = strings.TrimSpace(status)
	if !karyaStatuses[status] {
		return nil, fmt.Errorf("status tidak dikenal")
	}
	note = strings.TrimSpace(note)
	if len([]rune(note)) > KaryaMaxNoteChars {
		return nil, fmt.Errorf("catatan maksimal %d karakter", KaryaMaxNoteChars)
	}
	if _, err := orm.GetByID[models.Karya](ctx, id); err != nil {
		return nil, ErrKaryaNotFound
	}
	return orm.UpdateByID[models.Karya](ctx, id, map[string]any{
		"status":       status,
		"review_note":  note,
		"published_at": publishedAtFor(status),
	})
}

func publishedAtFor(status string) any {
	if status == "published" {
		return time.Now()
	}
	return nil
}

func (KaryaService) Delete(ctx context.Context, id int64) error {
	if _, err := orm.GetByID[models.Karya](ctx, id); err != nil {
		return ErrKaryaNotFound
	}
	_, err := orm.DeleteByID[models.Karya](ctx, id)
	return err
}

// ---------------------------------------------------------------------------
// Like
// ---------------------------------------------------------------------------

// VisitorHash: identitas pemberi like hanya untuk menahan like berulang, tidak
// pernah dipakai untuk menampilkan siapa pun. Tanpa salt: nilainya bukan
// rahasia dan id pengunjung sudah acak, sedangkan salt hanya menambah cara
// merusak data lama ketika nilainya berubah.
func VisitorHash(visitorID, ip string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(visitorID) + "|" + strings.TrimSpace(ip)))
	return hex.EncodeToString(sum[:])
}

// Like menaikkan like_count sekali per pengunjung dan mengembalikan angka
// terbaru. Duplikat tidak menaikkan apa pun.
func (KaryaService) Like(ctx context.Context, code, visitorHash string) (int, error) {
	k, err := orm.Objects[models.Karya](ctx).Filter("code", strings.ToUpper(strings.TrimSpace(code))).First()
	if err != nil || k == nil || k.Status != "published" {
		return 0, ErrKaryaNotFound
	}
	existing, err := orm.Objects[models.KaryaLike](ctx).
		Filter("karya_id", k.ID).Filter("visitor_hash", visitorHash).First()
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	}
	if existing != nil {
		return k.LikeCount, nil
	}
	if _, err := orm.Create(ctx, &models.KaryaLike{KaryaID: k.ID, VisitorHash: visitorHash}); err != nil {
		// Balapan: pengunjung yang sama menekan dua kali hampir bersamaan.
		// Baris pertama sudah menang, jadi angka tidak perlu dinaikkan lagi.
		return k.LikeCount, nil
	}
	// Increment atomik: dua pengunjung berbeda bisa menekan bersamaan.
	db := orm.DBFromContext(ctx)
	if db == nil {
		return k.LikeCount + 1, nil
	}
	var count int
	if err := db.QueryRowContext(ctx,
		`UPDATE karya SET like_count = like_count + 1, updated_at = NOW() WHERE id = $1 RETURNING like_count`,
		k.ID).Scan(&count); err != nil {
		return k.LikeCount + 1, nil
	}
	return count, nil
}

// ---------------------------------------------------------------------------
// Baca
// ---------------------------------------------------------------------------

func himpunanNames(ctx context.Context) map[int64]string {
	list, err := orm.Objects[models.Himpunan](ctx).All()
	out := make(map[int64]string, len(list))
	if err != nil {
		return out
	}
	for _, h := range list {
		out[h.ID] = himpunanLabel(h)
	}
	return out
}

// imagesOf: foto per karya dipetakan sekali untuk satu halaman, bukan query per
// baris (katalog bisa puluhan kartu).
func imagesOf(ctx context.Context, ids []int64) map[int64][]string {
	out := map[int64][]string{}
	if len(ids) == 0 {
		return out
	}
	rows, err := orm.Objects[models.KaryaImage](ctx).Filter("karya_id__in", ids).OrderBy("sort_order", "id").All()
	if err != nil {
		return out
	}
	for _, img := range rows {
		out[img.KaryaID] = append(out[img.KaryaID], img.URL)
	}
	return out
}

func toKaryaView(k *models.Karya, names map[int64]string, images []string) KaryaView {
	return KaryaView{
		ID: k.ID, Code: k.Code, Title: k.Title, AuthorName: k.AuthorName,
		Himpunan: names[k.HimpunanID], HimpunanID: k.HimpunanID,
		RepoURL: k.RepoURL, Images: images,
		Status: k.Status, ReviewNote: k.ReviewNote, LikeCount: k.LikeCount,
		PublishedAt: k.PublishedAt, CreatedAt: k.CreatedAt,
	}
}

// ListPublic: hanya yang published. Urutan default "likes" = like terbanyak
// dulu, lalu kiriman terlama lebih dulu — dengan begitu karya pertama yang
// diajukan muncul selama belum ada like sama sekali.
func (KaryaService) ListPublic(ctx context.Context, himpunanID int64, sort string, limit, offset int) ([]KaryaView, int, error) {
	qs := orm.Objects[models.Karya](ctx).Filter("status", "published")
	if himpunanID > 0 {
		qs = qs.Filter("himpunan_id", himpunanID)
	}
	total, err := qs.Count()
	if err != nil {
		return nil, 0, err
	}
	if sort == "new" {
		qs = qs.OrderBy("-id")
	} else {
		qs = qs.OrderBy("-like_count", "id")
	}
	rows, err := qs.Limit(limit).Offset(offset).All()
	if err != nil {
		return nil, 0, err
	}
	names := himpunanNames(ctx)
	ids := make([]int64, len(rows))
	for i, k := range rows {
		ids[i] = k.ID
	}
	images := imagesOf(ctx, ids)
	out := make([]KaryaView, len(rows))
	for i, k := range rows {
		out[i] = toKaryaView(k, names, images[k.ID])
	}
	return out, int(total), nil
}

// Featured: satu karya untuk landing, memakai urutan default yang sama.
func (KaryaService) Featured(ctx context.Context) (*KaryaView, error) {
	rows, _, err := (KaryaService{}).ListPublic(ctx, 0, "", 1, 0)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return &rows[0], nil
}

// PublicByCode: detail karya yang sudah tayang, lengkap dengan HTML hasil render.
func (KaryaService) PublicByCode(ctx context.Context, code string) (*KaryaView, error) {
	k, err := orm.Objects[models.Karya](ctx).Filter("code", strings.ToUpper(strings.TrimSpace(code))).First()
	if err != nil || k == nil || k.Status != "published" {
		return nil, ErrKaryaNotFound
	}
	v := toKaryaView(k, himpunanNames(ctx), imagesOf(ctx, []int64{k.ID})[k.ID])
	v.AboutHTML = RenderKaryaMarkdown(k.AboutMD)
	return &v, nil
}

// StatusByCode: untuk pengirim tanpa akun. Tidak pernah mengembalikan isi karya,
// gambar, atau identitas pengunjung.
func (KaryaService) StatusByCode(ctx context.Context, code string) (map[string]any, error) {
	k, err := orm.Objects[models.Karya](ctx).Filter("code", strings.ToUpper(strings.TrimSpace(code))).First()
	if err != nil || k == nil {
		return nil, ErrKaryaNotFound
	}
	out := map[string]any{
		"code": k.Code, "title": k.Title, "status": k.Status,
		"created_at": k.CreatedAt,
	}
	if k.Status == "rejected" && k.ReviewNote != "" {
		out["review_note"] = k.ReviewNote
	}
	if k.PublishedAt != nil {
		out["published_at"] = k.PublishedAt
	}
	return out, nil
}

// ByID: dipakai halaman kurasi admin. Boleh membuka karya berstatus apa pun,
// dan markdown-nya ikut dirender supaya pengurus membaca isi aslinya sebelum
// memutuskan.
func (KaryaService) ByID(ctx context.Context, id int64) (*KaryaView, error) {
	k, err := orm.GetByID[models.Karya](ctx, id)
	if err != nil {
		return nil, ErrKaryaNotFound
	}
	v := toKaryaView(k, himpunanNames(ctx), imagesOf(ctx, []int64{k.ID})[k.ID])
	v.AboutHTML = RenderKaryaMarkdown(k.AboutMD)
	v.AboutMD = k.AboutMD
	return &v, nil
}

// ListAll: untuk admin, semua status.
func (KaryaService) ListAll(ctx context.Context, status string) ([]KaryaView, error) {
	qs := orm.Objects[models.Karya](ctx)
	if status != "" {
		qs = qs.Filter("status", status)
	}
	rows, err := qs.OrderBy("-id").All()
	if err != nil {
		return nil, err
	}
	names := himpunanNames(ctx)
	ids := make([]int64, len(rows))
	for i, k := range rows {
		ids[i] = k.ID
	}
	images := imagesOf(ctx, ids)
	out := make([]KaryaView, len(rows))
	for i, k := range rows {
		out[i] = toKaryaView(k, names, images[k.ID])
	}
	return out, nil
}

// ---------------------------------------------------------------------------
// Rate limit endpoint publik
// ---------------------------------------------------------------------------

// In-memory, satu instance backend (lihat PONYTAIL-DEBT untuk pindah ke Redis
// bila backend di-scale). Masing-masing punya kuota sendiri supaya pratinjau
// yang sering dipakai tidak menghabiskan jatah pengajuan.
var (
	karyaSubmitLimiter  = &ipLimiter{hits: map[string][]time.Time{}, max: 3, window: time.Hour, gcEvery: 10 * time.Minute}
	karyaPreviewLimiter = &ipLimiter{hits: map[string][]time.Time{}, max: 60, window: time.Hour, gcEvery: 10 * time.Minute}
	karyaLikeLimiter    = &ipLimiter{hits: map[string][]time.Time{}, max: 30, window: time.Hour, gcEvery: 10 * time.Minute}
)

func AllowKaryaSubmit(ip string) bool  { return karyaSubmitLimiter.Allow(ip) }
func AllowKaryaPreview(ip string) bool { return karyaPreviewLimiter.Allow(ip) }
func AllowKaryaLike(ip string) bool    { return karyaLikeLimiter.Allow(ip) }

// ResetKaryaLimiters hanya untuk test.
func ResetKaryaLimiters() {
	for _, l := range []*ipLimiter{karyaSubmitLimiter, karyaPreviewLimiter, karyaLikeLimiter} {
		l.mu.Lock()
		l.hits = map[string][]time.Time{}
		l.lastGC = time.Time{}
		l.mu.Unlock()
	}
}
