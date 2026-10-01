package services

import (
	"strings"
	"testing"
	"time"
)

func TestFormatLetterNumber(t *testing.T) {
	tmpl := "{number}/{code}/{month_roman}/{year}"
	date := time.Date(2026, 7, 25, 0, 0, 0, 0, time.UTC)
	got, err := FormatLetterNumber(tmpl, 5, "UND", date, nil, true)
	if err != nil {
		t.Fatal(err)
	}
	want := "005/UND/VII/2026"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestFormatLetterNumberUnpadded(t *testing.T) {
	tmpl := "{number:0}/{code}/{year}"
	date := time.Date(2026, 7, 25, 0, 0, 0, 0, time.UTC)
	got, err := FormatLetterNumber(tmpl, 5, "UND", date, nil, true)
	if err != nil {
		t.Fatal(err)
	}
	if got != "5/UND/2026" {
		t.Fatalf("got %q", got)
	}
}

func TestFormatLetterNumberZeroPadAndSegment(t *testing.T) {
	tmpl := "{number:3}/{code}/{unit}/Permikomnas Jawa Tengah/{month_roman}/{year}"
	date := time.Date(2026, 7, 25, 0, 0, 0, 0, time.UTC)
	extras := map[string]string{"unit": "PAN-Stuband"}
	got, err := FormatLetterNumber(tmpl, 1, "SPm-i", date, extras, false)
	if err != nil {
		t.Fatal(err)
	}
	want := "001/SPm-i/PAN-Stuband/Permikomnas Jawa Tengah/VII/2026"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestFormatLetterNumberMissingSegmentError(t *testing.T) {
	tmpl := "{number:3}/{code}/{unit}/Permikomnas Jawa Tengah/{month_roman}/{year}"
	date := time.Date(2026, 7, 25, 0, 0, 0, 0, time.UTC)
	got, err := FormatLetterNumber(tmpl, 1, "SPm-i", date, nil, false)
	if err != nil {
		t.Fatal(err)
	}
	// Missing segment should not error; double separators should collapse
	if got != "001/SPm-i/Permikomnas Jawa Tengah/VII/2026" {
		t.Fatalf("got %q want %q", got, "001/SPm-i/Permikomnas Jawa Tengah/VII/2026")
	}
}

func TestFormatLetterNumberCollapseDoubleSlash(t *testing.T) {
	tmpl := "{number:3}/{code}{tujuan}/{unit}/Permikomnas Jawa Tengah/{month_roman}/{year}"
	date := time.Date(2026, 7, 25, 0, 0, 0, 0, time.UTC)
	got, err := FormatLetterNumber(tmpl, 1, "SPm-i", date, nil, false)
	if err != nil {
		t.Fatal(err)
	}
	if got != "001/SPm-i/Permikomnas Jawa Tengah/VII/2026" {
		t.Fatalf("got %q want %q", got, "001/SPm-i/Permikomnas Jawa Tengah/VII/2026")
	}
}

func TestFormatLetterNumberPreviewMissingSegment(t *testing.T) {
	tmpl := "{number:3}/{code}/{unit}/Permikomnas Jawa Tengah/{month_roman}/{year}"
	date := time.Date(2026, 7, 25, 0, 0, 0, 0, time.UTC)
	got, err := FormatLetterNumber(tmpl, 1, "SPm-i", date, nil, true)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(got, "[unit]") {
		t.Fatalf("expected [unit] placeholder in preview, got %q", got)
	}
}

func TestExtractCustomPlaceholders(t *testing.T) {
	tmpl := "{number:3}/{code}/{unit}/Permikomnas Jawa Tengah/{tujuan}/{month_roman}/{year}"
	got := ExtractCustomPlaceholders(tmpl)
	want := []string{"unit", "tujuan"}
	if len(got) != len(want) {
		t.Fatalf("got %v want %v", got, want)
	}
	for i, w := range want {
		if got[i] != w {
			t.Fatalf("got %v want %v", got, want)
		}
	}
}

func TestComputeEventStatus(t *testing.T) {
	start := time.Date(2026, 7, 25, 9, 0, 0, 0, time.Local)
	end := time.Date(2026, 7, 25, 17, 0, 0, 0, time.Local)

	cases := []struct {
		now  time.Time
		want string
	}{
		{time.Date(2026, 7, 24, 23, 59, 0, 0, time.Local), "upcoming"},
		{time.Date(2026, 7, 25, 9, 0, 0, 0, time.Local), "ongoing"},
		{time.Date(2026, 7, 25, 12, 0, 0, 0, time.Local), "ongoing"},
		{time.Date(2026, 7, 25, 17, 0, 0, 0, time.Local), "ongoing"},
		{time.Date(2026, 7, 25, 17, 0, 1, 0, time.Local), "finished"},
	}

	for _, tc := range cases {
		got := computeEventStatus(start, end, tc.now)
		if got != tc.want {
			t.Fatalf("now=%v got %q want %q", tc.now, got, tc.want)
		}
	}
}

// Izin ditutup tepat 3 jam sebelum mulai, bukan setelah event selesai.
func TestPermissionClosedAtLeadTime(t *testing.T) {
	start := time.Date(2026, 10, 1, 19, 0, 0, 0, time.Local)
	if got := PermissionDeadline(start); !got.Equal(time.Date(2026, 10, 1, 16, 0, 0, 0, time.Local)) {
		t.Fatalf("deadline %v, ingin 16:00", got)
	}
	cases := []struct {
		now  time.Time
		want bool
	}{
		{time.Date(2026, 10, 1, 9, 0, 0, 0, time.Local), false},
		{time.Date(2026, 10, 1, 16, 0, 0, 0, time.Local), false}, // tepat di batas masih boleh
		{time.Date(2026, 10, 1, 16, 0, 1, 0, time.Local), true},
		{time.Date(2026, 10, 1, 19, 30, 0, 0, time.Local), true}, // saat event berjalan
	}
	for _, tc := range cases {
		if got := PermissionClosed(start, tc.now); got != tc.want {
			t.Fatalf("now=%v: dapat %v, ingin %v", tc.now, got, tc.want)
		}
	}
}

// Warna divisi hanya boleh token CSS yang punya nilai kontras sudah diuji.
func TestDivisionColorAllowlist(t *testing.T) {
	allowed := []string{"", "division-1", "division-8"}
	for _, color := range allowed {
		if !divisionColors[color] {
			t.Fatalf("%q seharusnya diterima", color)
		}
	}
	rejected := []string{"red", "#ff0000", "var(--division-1)", "division-9", "DIVISION-1"}
	for _, color := range rejected {
		if divisionColors[color] {
			t.Fatalf("%q seharusnya ditolak", color)
		}
	}
}

// Event tanpa waktu selesai harus tetap punya batas: hari itu sendiri.
func TestEndOfDayKeepsEventOpenUntilDayEnds(t *testing.T) {
	start := time.Date(2026, 7, 25, 9, 0, 0, 0, time.Local)
	end := endOfDay(start)
	if want := time.Date(2026, 7, 25, 23, 59, 59, 0, time.Local); !end.Equal(want) {
		t.Fatalf("got %v want %v", end, want)
	}
	if got := computeEventStatus(start, end, time.Date(2026, 7, 25, 20, 0, 0, 0, time.Local)); got != "ongoing" {
		t.Fatalf("same day got %q want ongoing", got)
	}
	if got := computeEventStatus(start, end, time.Date(2026, 7, 26, 0, 1, 0, 0, time.Local)); got != "finished" {
		t.Fatalf("next day got %q want finished", got)
	}
}

func TestFormatLetterNumberLegacyAliases(t *testing.T) {
	tmpl := "{NOMOR_SURAT}-{LETTER_CODE}"
	date := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	got, err := FormatLetterNumber(tmpl, 12, "SK", date, nil, true)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(got, "12") || !strings.Contains(got, "SK") {
		t.Fatalf("unexpected: %q", got)
	}
}
