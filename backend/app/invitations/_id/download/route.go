package download

import (
	"errors"
	"net/http"
	"strings"

	"backend/internal/auth"
	"backend/internal/storageutil"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /invitations/:id/download — unduh lampiran PDF.
//
// Cukup login (sama seperti daftar): anggota yang ditugaskan perlu membaca
// undangannya. Nama file diambil dari kolom attachment_name, bukan dari URL
// storage, supaya yang tersimpan ke perangkat pengguna nama aslinya.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		inv, err := services.InvitationService{}.GetModel(c.Request.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return c.Error(404, "undangan tidak ditemukan")
			}
			return c.Error(500, err.Error())
		}
		if inv.AttachmentURL == "" {
			return c.Error(404, "undangan tidak punya lampiran")
		}

		if strings.HasPrefix(inv.AttachmentURL, "http://") || strings.HasPrefix(inv.AttachmentURL, "https://") {
			http.Redirect(c.Writer, c.Request, inv.AttachmentURL, http.StatusFound)
			return nil
		}

		data, err := storageutil.ReadURL(c.Request.Context(), inv.AttachmentURL)
		if err != nil {
			return c.Error(500, err.Error())
		}
		name := inv.AttachmentName
		if name == "" {
			name = "undangan.pdf"
		}
		c.Writer.Header().Set("Content-Disposition", `attachment; filename="`+name+`"`)
		c.Writer.Header().Set("Content-Type", "application/pdf")
		c.Writer.WriteHeader(200)
		_, _ = c.Writer.Write(data)
		return nil
	})(ctx)
}
