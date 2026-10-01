package services

import (
	"testing"

	"backend/models"
)

func TestEventIncludesUserByDivision(t *testing.T) {
	e := &models.Event{Title: "Rapat Koor", Audience: "custom"}
	e.ID = 7
	targets := targetSets{
		divisions: map[int64][]int64{7: {6, 7}},
		roles:     map[int64][]int64{},
	}
	inDivision := &models.User{DivisionID: 7, RoleID: 5}
	outside := &models.User{DivisionID: 9, RoleID: 5}

	if !eventIncludesUser(e, targets, inDivision) {
		t.Fatal("anggota divisi target harus jadi peserta")
	}
	if eventIncludesUser(e, targets, outside) {
		t.Fatal("anggota di luar cakupan tidak boleh jadi peserta")
	}
}

func TestEventIncludesUserByRole(t *testing.T) {
	e := &models.Event{Title: "Rapat PH", Audience: "custom"}
	e.ID = 3
	targets := targetSets{
		divisions: map[int64][]int64{},
		roles:     map[int64][]int64{3: {6}}, // role PH
	}
	byRole := &models.User{DivisionID: 9, RoleID: 6}
	other := &models.User{DivisionID: 9, RoleID: 5}

	if !eventIncludesUser(e, targets, byRole) {
		t.Fatal("pemegang role target harus jadi peserta lintas divisi")
	}
	if eventIncludesUser(e, targets, other) {
		t.Fatal("role di luar cakupan tidak boleh jadi peserta")
	}
}

// Gabungan (OR): divisi dan role saling menambah, bukan saling memfilter.
func TestEventIncludesUserUnionOfDivisionAndRole(t *testing.T) {
	e := &models.Event{Title: "Rapat Koor PH + PSDM", Audience: "custom"}
	e.ID = 11
	targets := targetSets{
		divisions: map[int64][]int64{11: {6, 7}},
		roles:     map[int64][]int64{11: {6}},
	}
	fromDivision := &models.User{DivisionID: 7, RoleID: 5}
	fromRole := &models.User{DivisionID: 9, RoleID: 6}
	fromBoth := &models.User{DivisionID: 6, RoleID: 6} // PH divisi + PH role
	neither := &models.User{DivisionID: 9, RoleID: 5}

	for name, u := range map[string]*models.User{
		"dari divisi PSDM": fromDivision,
		"dari role PH":     fromRole,
		"divisi dan role":  fromBoth,
	} {
		if !eventIncludesUser(e, targets, u) {
			t.Fatalf("%s harus jadi peserta", name)
		}
	}
	if eventIncludesUser(e, targets, neither) {
		t.Fatal("user di luar kedua sumbu tidak boleh jadi peserta")
	}
}

func TestEventIncludesUserAll(t *testing.T) {
	e := &models.Event{Title: "Upgrading", Audience: "all"}
	e.ID = 5
	if !eventIncludesUser(e, targetSets{}, &models.User{DivisionID: 99, RoleID: 99}) {
		t.Fatal("audience all berarti semua anggota")
	}
}

func TestEventIncludesUserEmptyTargets(t *testing.T) {
	e := &models.Event{Title: "Tanpa cakupan", Audience: "custom"}
	e.ID = 5
	if eventIncludesUser(e, targetSets{}, &models.User{DivisionID: 1, RoleID: 1}) {
		t.Fatal("tanpa target berarti tidak ada peserta")
	}
}

func TestValidateAudience(t *testing.T) {
	if err := validateAudience("all", nil, nil); err != nil {
		t.Fatalf("audience all tidak butuh target: %v", err)
	}
	if err := validateAudience("custom", nil, nil); err == nil {
		t.Fatal("custom tanpa target harus ditolak")
	}
	if err := validateAudience("custom", []int64{6}, nil); err != nil {
		t.Fatalf("custom dengan divisi harus lolos: %v", err)
	}
	if err := validateAudience("custom", nil, []int64{6}); err != nil {
		t.Fatalf("custom dengan role harus lolos: %v", err)
	}
}

func TestDedupe(t *testing.T) {
	got := dedupe([]int64{3, 3, 0, -1, 5, 3})
	if len(got) != 2 || got[0] != 3 || got[1] != 5 {
		t.Fatalf("got %v want [3 5]", got)
	}
}
