package code

import (
	"errors"

	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/karya_status/:code — dipakai pengirim tanpa akun untuk mengecek
// nasib kirimannya. Tidak pernah mengembalikan isi karya atau gambar.
//
// Sejajar dengan /public/karya, bukan di bawahnya, karena alasan yang sama
// dengan /public/karya_preview (router linear).
func GET(ctx *views.Context) error {
	data, err := services.KaryaService{}.StatusByCode(ctx.Request.Context(), ctx.Param("code"))
	if errors.Is(err, services.ErrKaryaNotFound) {
		return ctx.Error(404, "kode tidak ditemukan")
	}
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "status karya", data)
}
