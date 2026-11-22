// Package contentform membaca body POST/PUT yang boleh berupa multipart/form-data
// ATAU JSON ke bentuk yang sama (map string), plus satu file gambar opsional.
// Dipakai resource konten publik (press release, merch).
package contentform

import (
	"fmt"
	"io"
	"strconv"
	"strings"

	"backend/internal/storageutil"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// Form: nilai teks (hanya key yang benar-benar dikirim) dan file gambar.
type Form struct {
	Values map[string]string
	// Image nil = tidak ada file baru dikirim.
	Image *services.ImageInfo
	Data  []byte
}

// Read mem-parse request. fileField = nama field file ("cover" / "image").
func Read(c *views.Context, fileField string) (*Form, error) {
	f := &Form{Values: map[string]string{}}
	ct := c.Request.Header.Get("Content-Type")
	if strings.HasPrefix(ct, "multipart/form-data") {
		if err := c.ParseMultipart(services.ImageMaxBytes + (1 << 20)); err != nil {
			return nil, fmt.Errorf("gagal membaca form: %w", err)
		}
		if mf := c.Request.MultipartForm; mf != nil {
			for k, v := range mf.Value {
				if len(v) > 0 {
					f.Values[k] = v[0]
				}
			}
		}
		file, _, err := c.FormFile(fileField)
		if err == nil && file != nil {
			defer file.Close()
			data, err := io.ReadAll(io.LimitReader(file, services.ImageMaxBytes+1))
			if err != nil {
				return nil, fmt.Errorf("gagal membaca gambar")
			}
			info, err := services.DetectImage(data)
			if err != nil {
				return nil, err
			}
			f.Image, f.Data = &info, data
		}
		return f, nil
	}
	var body map[string]any
	if err := c.Bind(&body); err != nil {
		return nil, err
	}
	for k, v := range body {
		switch t := v.(type) {
		case nil:
		case string:
			f.Values[k] = t
		case bool:
			f.Values[k] = strconv.FormatBool(t)
		case float64:
			f.Values[k] = strconv.FormatFloat(t, 'f', -1, 64)
		}
	}
	return f, nil
}

// Upload menyimpan gambar ke object storage dan mengembalikan URL-nya.
func (f *Form) Upload(c *views.Context, prefix string) (string, error) {
	key := storageutil.Key(prefix, "image"+f.Image.Ext)
	return storageutil.Upload(c.Request.Context(), key, f.Data, f.Image.MIME)
}
