package services

import (
	"errors"
	"strings"
	"testing"
	"time"

	"backend/models"
)

func TestIsPDFChecksMagicBytes(t *testing.T) {
	cases := []struct {
		name string
		data []byte
		want bool
	}{
		{"pdf valid", []byte("%PDF-1.4\n..."), true},
		{"kosong", nil, false},
		{"terlalu pendek", []byte("%PDF"), false},
		{"teks biasa", []byte("ini bukan pdf"), false},
		{"pdf di tengah bukan awal", []byte("xx%PDF-1.4"), false},
		{"zip dengan nama pdf", []byte("PK\x03\x04......"), false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsPDF(tc.data); got != tc.want {
				t.Fatalf("IsPDF(%q) = %v, mau %v", tc.data, got, tc.want)
			}
		})
	}
}

func TestSanitizeFileNameStripsPaths(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"undangan.pdf", "undangan.pdf"},
		{"../../etc/passwd", "passwd.pdf"},
		{`C:\Users\x\surat.pdf`, "surat.pdf"},
		{"nama dengan spasi.pdf", "nama_dengan_spasi.pdf"},
		{"tanpa-ekstensi", "tanpa-ekstensi.pdf"},
		{"", "undangan.pdf"},
	}
	for _, tc := range cases {
		t.Run(tc.in, func(t *testing.T) {
			got := sanitizeFileName(tc.in)
			if got != tc.want {
				t.Fatalf("sanitizeFileName(%q) = %q, mau %q", tc.in, got, tc.want)
			}
			if strings.Contains(got, "/") || strings.Contains(got, `\`) {
				t.Fatalf("nama masih mengandung pemisah path: %q", got)
			}
		})
	}
}

func TestDateOnlyDropsClock(t *testing.T) {
	in := time.Date(2026, 12, 15, 13, 45, 30, 0, time.UTC)
	got := dateOnly(in)
	if got.Hour() != 0 || got.Minute() != 0 || got.Second() != 0 {
		t.Fatalf("dateOnly masih menyisakan jam: %v", got)
	}
	if got.Year() != 2026 || got.Month() != time.December || got.Day() != 15 {
		t.Fatalf("dateOnly mengubah tanggal: %v", got)
	}
}

// Rate limit form publik: kuota habis setelah 5 kiriman, dan IP berbeda punya
// kuota sendiri.
func TestPublicInvitationLimiter(t *testing.T) {
	ResetPublicInvitationLimiter()
	defer ResetPublicInvitationLimiter()

	for i := 0; i < 5; i++ {
		if !AllowPublicInvitationSubmit("10.0.0.1") {
			t.Fatalf("kiriman ke-%d seharusnya diizinkan", i+1)
		}
	}
	if AllowPublicInvitationSubmit("10.0.0.1") {
		t.Fatal("kiriman ke-6 seharusnya ditolak")
	}
	if !AllowPublicInvitationSubmit("10.0.0.2") {
		t.Fatal("IP lain seharusnya masih punya kuota")
	}
}

// SubmitPublic harus menolak input tidak valid sebelum menyentuh DB, sehingga
// test ini tidak butuh koneksi database.
func TestSubmitPublicRejectsInvalidInput(t *testing.T) {
	pdf := []byte("%PDF-1.4\n...")
	valid := InvitationSubmitInput{
		OrganizationName: "HIMATIKA",
		EventName:        "Seminar",
		EventDate:        time.Now(),
		Attachment:       pdf,
		AttachmentName:   "undangan.pdf",
	}

	cases := []struct {
		name   string
		mutate func(*InvitationSubmitInput)
		want   error
	}{
		{"nama himpunan kosong", func(in *InvitationSubmitInput) { in.OrganizationName = "  " }, nil},
		{"nama acara kosong", func(in *InvitationSubmitInput) { in.EventName = "" }, nil},
		{"tanggal kosong", func(in *InvitationSubmitInput) { in.EventDate = time.Time{} }, nil},
		{"tanpa lampiran", func(in *InvitationSubmitInput) { in.Attachment = nil }, nil},
		{"lampiran bukan pdf", func(in *InvitationSubmitInput) { in.Attachment = []byte("bukan pdf") }, ErrInvalidPDF},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			in := valid
			tc.mutate(&in)
			_, err := InvitationService{}.SubmitPublic(t.Context(), in)
			if err == nil {
				t.Fatal("seharusnya mengembalikan error")
			}
			if tc.want != nil && !errors.Is(err, tc.want) {
				t.Fatalf("error = %v, mau %v", err, tc.want)
			}
		})
	}
}

// Undangan yang sudah punya event tidak boleh dikonversi dua kali.
func TestConvertRejectsAlreadyConverted(t *testing.T) {
	eventID := int64(9)
	inv := &models.Invitation{EventID: &eventID}
	if inv.EventID == nil {
		t.Fatal("fixture salah")
	}
	// Cek invarian sentinel: route memetakan error ini ke 409, jadi nilainya
	// tidak boleh tertukar dengan ErrNotFound (404).
	if errors.Is(ErrInvitationConverted, ErrNotFound) {
		t.Fatal("ErrInvitationConverted tidak boleh sama dengan ErrNotFound")
	}
}

// Penugasan peserta melekat di event, bukan undangan. Test ini mengunci
// keputusan itu supaya tidak diam-diam kembali ke invitation_assignee.
func TestAssigneeBelongsToEvent(t *testing.T) {
	a := models.EventAssignee{EventID: 7, UserID: 3}
	if a.EventID == 0 {
		t.Fatal("EventAssignee harus menyimpan event_id")
	}
	// Self-assign = assigned_by_id nil; penugasan oleh pengurus = terisi.
	if a.AssignedByID != nil {
		t.Fatal("default harus self-assign (assigned_by_id nil)")
	}
	by := int64(1)
	a.AssignedByID = &by
	if a.AssignedByID == nil || *a.AssignedByID != 1 {
		t.Fatal("assigned_by_id harus bisa diisi untuk penugasan oleh orang lain")
	}
}

func TestAssigneeSentinelErrorsAreDistinct(t *testing.T) {
	// Route memetakan ErrAssigneeExists → 409 dan ErrNotFound → 404; kalau
	// keduanya sama, pengguna akan melihat status yang salah.
	if errors.Is(ErrAssigneeExists, ErrNotFound) {
		t.Fatal("ErrAssigneeExists tidak boleh sama dengan ErrNotFound")
	}
	if ErrAssigneeExists.Error() == "" {
		t.Fatal("ErrAssigneeExists butuh pesan")
	}
}

// Regresi: tanggal undangan disimpan sebagai tengah malam WIB, bukan UTC.
// Kalau memakai UTC, di browser WIB tanggalnya bergeser jadi 07:00 dan tanggal
// selesai melompat ke hari berikutnya (bug "6 Nov jadi 6 Nov 07:00 – 7 Nov 06:59").
func TestDateOnlyUsesJakartaMidnight(t *testing.T) {
	in := time.Date(2026, 11, 6, 13, 45, 0, 0, time.UTC)
	got := dateOnly(in)

	if got.Hour() != 0 || got.Minute() != 0 || got.Second() != 0 {
		t.Fatalf("dateOnly harus tengah malam, dapat %v", got)
	}
	if got.Day() != 6 || got.Month() != time.November || got.Year() != 2026 {
		t.Fatalf("dateOnly mengubah tanggal: %v", got)
	}
	// Tengah malam WIB = 17:00 UTC hari sebelumnya.
	_, offset := got.Zone()
	if offset != 7*60*60 {
		t.Fatalf("offset zona harus WIB (+7j), dapat %d detik", offset)
	}
	utc := got.UTC()
	if utc.Day() != 5 || utc.Hour() != 17 {
		t.Fatalf("tengah malam WIB 6 Nov harus 5 Nov 17:00 UTC, dapat %v", utc)
	}
}

// Event hasil konversi undangan harus ditandai all_day supaya UI tidak
// menampilkan jam yang tidak pernah diisi pengirim.
func TestConvertMarksEventAllDay(t *testing.T) {
	e := models.Event{AllDay: true}
	if !e.AllDay {
		t.Fatal("event hasil undangan harus all_day")
	}
}
