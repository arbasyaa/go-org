// Package clientip mengambil alamat IP pengirim dari request, menghormati header
// proxy karena di produksi backend berada di belakang frontend Next.js/Traefik.
package clientip

import (
	"strings"

	"github.com/lrndwy/gokil/views"
)

// From mengembalikan IP pengirim tanpa port.
func From(c *views.Context) string {
	if fwd := c.Request.Header.Get("X-Forwarded-For"); fwd != "" {
		if i := strings.Index(fwd, ","); i > 0 {
			return strings.TrimSpace(fwd[:i])
		}
		return strings.TrimSpace(fwd)
	}
	if real := c.Request.Header.Get("X-Real-IP"); real != "" {
		return strings.TrimSpace(real)
	}
	host := c.Request.RemoteAddr
	if i := strings.LastIndex(host, ":"); i > 0 {
		return host[:i]
	}
	return host
}