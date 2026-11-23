package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// LandingSectionKeys: section landing yang bisa disembunyikan (hero selalu tampil).
var LandingSectionKeys = map[string]bool{
	"about": true, "programs": true, "press": true, "members": true,
	"officials": true, "karya": true, "merch": true, "invitation": true, "cta": true,
}

// ValidateLandingSections: "" atau JSON object dengan key yang dikenal dan nilai bool.
// Mengembalikan string yang sudah dirapikan (trim).
func ValidateLandingSections(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", nil
	}
	dec := json.NewDecoder(bytes.NewReader([]byte(raw)))
	var m map[string]any
	if err := dec.Decode(&m); err != nil || m == nil || dec.More() {
		return "", fmt.Errorf("landing_sections harus berupa objek JSON")
	}
	for k, v := range m {
		if !LandingSectionKeys[k] {
			return "", fmt.Errorf("section landing tidak dikenal: %s", k)
		}
		if _, ok := v.(bool); !ok {
			return "", fmt.Errorf("nilai section %s harus true atau false", k)
		}
	}
	return raw, nil
}

// SetLandingSections memvalidasi lalu menulis HANYA kolom landing_sections.
func (SettingsService) SetLandingSections(ctx context.Context, raw string) (*models.OrganizationSettings, error) {
	clean, err := ValidateLandingSections(raw)
	if err != nil {
		return nil, err
	}
	s, err := orm.Objects[models.OrganizationSettings](ctx).First()
	if err != nil {
		return nil, err
	}
	return orm.UpdateByID[models.OrganizationSettings](ctx, s.ID, map[string]any{"landing_sections": clean})
}
