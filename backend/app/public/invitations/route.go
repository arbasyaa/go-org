package invitations

import (
	"io"
	"strings"
	"time"

	"backend/internal/clientip"
	"backend/internal/storageutil"
	"backend/internal/timeutil"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// POST /public/invitations — form undangan tanpa login.
//
// Endpoint publik pertama yang menerima upload, jadi proteksinya berlapis:
// honeypot field, rate limit per IP, validasi magic bytes PDF, dan cap ukuran.
//
// Urutan penting: validasi dulu (murah), baru unggah berkas (mahal). Kalau
// unggah gagal setelah validasi, baris DB belum dibuat sehingga tidak ada
// undangan tanpa lampiran.
func POST(ctx *views.Context) error {
	ip := clientip.From(ctx)

	if err := ctx.ParseMultipart(services.InvitationMaxAttachmentBytes + (1 << 20)); err != nil {
		return ctx.Error(400, "gagal membaca form: "+err.Error())
	}

	// Honeypot: field ini tersembunyi di UI dan hanya terisi bot. Balas sukses
	// palsu supaya bot tidak belajar apa pun, tapi jangan simpan apa pun.
	if strings.TrimSpace(ctx.Request.FormValue("website")) != "" {
		return ctx.Success(201, "undangan terkirim", map[string]any{"id": 0})
	}

	if !services.AllowPublicInvitationSubmit(ip) {
		return ctx.Error(429, "terlalu banyak pengiriman dari jaringan ini, coba lagi nanti")
	}

	orgName := ctx.Request.FormValue("organization_name")
	eventName := ctx.Request.FormValue("event_name")
	dateRaw := ctx.Request.FormValue("event_date")

	eventDate, err := timeutil.ParseFlexible(dateRaw)
	if err != nil {
		return ctx.Error(400, "tanggal acara tidak valid")
	}

	file, header, err := ctx.FormFile("attachment")
	if err != nil || file == nil || header == nil {
		return ctx.Error(400, "lampiran PDF wajib diunggah")
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return ctx.Error(500, "gagal membaca lampiran")
	}

	name := sanitizePublicName(header.Filename)
	key := storageutil.Key("invitations", name)
	url, err := storageutil.Upload(ctx.Request.Context(), key, data, "application/pdf")
	if err != nil {
		return ctx.Error(500, "gagal menyimpan lampiran")
	}

	inv, err := services.InvitationService{}.SubmitPublic(ctx.Request.Context(), services.InvitationSubmitInput{
		OrganizationName: orgName,
		EventName:        eventName,
		EventDate:        eventDate,
		Attachment:       data,
		AttachmentName:   name,
		AttachmentURL:    url,
		SubmittedIP:      ip,
	})
	if err != nil {
		return ctx.Error(400, err.Error())
	}

	// Ringkas saja: jangan bocorkan path storage atau IP ke pengirim anonim.
	return ctx.Success(201, "undangan terkirim", map[string]any{
		"id":         inv.ID,
		"created_at": time.Now(),
	})
}

// sanitizePublicName hanya membuang komponen path dari nama kiriman publik
// sebelum dipakai menyusun key storage. Normalisasi nama final (ekstensi .pdf,
// karakter aneh) tetap dilakukan service lewat sanitizeFileName.
func sanitizePublicName(name string) string {
	if i := strings.LastIndexAny(name, `/\`); i >= 0 {
		name = name[i+1:]
	}
	if strings.TrimSpace(name) == "" {
		return "undangan.pdf"
	}
	return name
}
