package letters

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"strconv"
	"strings"
	"time"

	"backend/internal/auth"
	"backend/internal/permission"
	"backend/internal/storageutil"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "letters.view")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		var categoryID int64
		if q := c.Query("category_id"); q != "" {
			categoryID, _ = models.ParseID(q)
		}
		list, err := services.LetterService{}.List(c.Request.Context(), c.Query("type"), categoryID)
		if err != nil {
			return c.Error(500, err.Error())
		}
		// Ekspor CSV memakai query yang sama dengan daftar. Dulu ini route
		// terpisah /letters/export, tapi router linear mendaftarkan /letters/:id
		// lebih dulu sehingga "export" terbaca sebagai id (selalu 400).
		if c.Query("export") != "" {
			c.Writer.Header().Set("Content-Type", "text/csv")
			c.Writer.Header().Set("Content-Disposition", `attachment; filename="letters.csv"`)
			w := csv.NewWriter(c.Writer)
			_ = w.Write([]string{"id", "type", "letter_code", "subject", "sender", "recipient", "letter_date"})
			for _, l := range list {
				_ = w.Write([]string{
					strconv.FormatInt(l.ID, 10), l.Type, l.LetterCode, l.Subject,
					l.Sender, l.Recipient, l.LetterDate.Format("2006-01-02"),
				})
			}
			w.Flush()
			return nil
		}
		return c.Success(200, "letters", list)
	})(ctx)
}

func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "letters.manage")
		if !ok {
			return c.Error(403, "akses ditolak")
		}

		var (
			letterType     string
			categoryID     int64
			templateID     int64
			subject        string
			letterDate     string
			sender         string
			recipient      string
			description    string
			attachmentURL  string
			variableValues json.RawMessage
			letterCode     string
		)

		ct := c.Request.Header.Get("Content-Type")
		if strings.HasPrefix(ct, "multipart/form-data") {
			if err := c.ParseMultipart(30 << 20); err != nil {
				return c.Error(400, err.Error())
			}
			letterType = c.Request.FormValue("type")
			subject = c.Request.FormValue("subject")
			sender = c.Request.FormValue("sender")
			letterCode = c.Request.FormValue("letter_code")
			categoryID, _ = models.ParseID(c.Request.FormValue("category_id"))
			templateID, _ = models.ParseID(c.Request.FormValue("template_id"))
			file, hdr, _ := c.FormFile("file")
			if file != nil && hdr != nil {
				defer file.Close()
				data, err := io.ReadAll(file)
				if err != nil {
					return c.Error(500, err.Error())
				}
				key := storageutil.Key("letters/incoming", hdr.Filename)
				url, err := storageutil.Upload(c.Request.Context(), key, data, hdr.Header.Get("Content-Type"))
				if err != nil {
					return c.Error(500, err.Error())
				}
				attachmentURL = url
			}
		} else {
			var body struct {
				Type           string          `json:"type"`
				CategoryID     int64           `json:"category_id"`
				TemplateID     int64           `json:"template_id"`
				Subject        string          `json:"subject"`
				LetterDate     string          `json:"letter_date"`
				Sender         string          `json:"sender"`
				Recipient      string          `json:"recipient"`
				Description    string          `json:"description"`
				AttachmentURL  string          `json:"attachment_url"`
				LetterCode     string          `json:"letter_code"`
				VariableValues json.RawMessage `json:"variable_values"`
			}
			if err := c.Bind(&body); err != nil {
				return c.Error(400, err.Error())
			}
			letterType = body.Type
			categoryID = body.CategoryID
			templateID = body.TemplateID
			subject = body.Subject
			letterDate = body.LetterDate
			sender = body.Sender
			recipient = body.Recipient
			description = body.Description
			attachmentURL = body.AttachmentURL
			letterCode = body.LetterCode
			variableValues = body.VariableValues
		}

		ld, _ := time.Parse("2006-01-02", letterDate)
		if ld.IsZero() {
			ld = time.Now()
		}
		letter := &models.Letter{
			CategoryID: categoryID, Subject: subject, LetterDate: ld,
			Sender: sender, Recipient: recipient, Description: description,
			AttachmentURL: attachmentURL, VariableValues: models.JSONField(variableValues),
			LetterCode: letterCode,
		}
		var result *models.Letter
		var err error
		if letterType == "outgoing" {
			if letter.CategoryID == 0 {
				return c.Error(400, "category_id required for outgoing letters")
			}
			result, err = services.LetterService{}.CreateOutgoing(c.Request.Context(), letter, templateID, user.ID)
		} else {
			result, err = services.LetterService{}.CreateIncoming(c.Request.Context(), letter, user.ID)
		}
		if err != nil {
			return c.Error(500, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "create", "letter", result.ID,
			"Membuat surat "+letterType+" "+subject, c.Request.RemoteAddr)
		return c.Success(201, "letter created", result)
	})(ctx)
}
