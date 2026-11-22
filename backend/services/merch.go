package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

type MerchService struct{}

var validStockStatus = map[string]bool{"ready": true, "preorder": true, "soldout": true}

// ValidStockStatus: ready | preorder | soldout.
func ValidStockStatus(s string) bool { return validStockStatus[s] }

type MerchInput struct {
	Name, Description, OrderURL, Category, StockStatus *string
	Price                                              *int64
	SortOrder                                          *int
	IsActive                                           *bool
	ImageURL                                           *string
	RemoveImage                                        bool
}

func MerchInputFromForm(v map[string]string) (MerchInput, error) {
	in := MerchInput{
		Name: formStr(v, "name"), Description: formStr(v, "description"), OrderURL: formStr(v, "order_url"),
		Category: formStr(v, "category"), StockStatus: formStr(v, "stock_status"),
	}
	var err error
	if s := formStr(v, "price"); s != nil {
		n, perr := strconv.ParseInt(*s, 10, 64)
		if perr != nil {
			return in, fmt.Errorf("harga harus berupa bilangan bulat")
		}
		in.Price = &n
	}
	if s := formStr(v, "sort_order"); s != nil {
		n, perr := strconv.Atoi(*s)
		if perr != nil {
			return in, fmt.Errorf("sort_order harus berupa bilangan bulat")
		}
		in.SortOrder = &n
	}
	if in.IsActive, err = formBool(v, "is_active"); err != nil {
		return in, err
	}
	rc, err := formBool(v, "remove_image")
	if err != nil {
		return in, err
	}
	in.RemoveImage = rc != nil && *rc
	return in, nil
}

// Validate dipanggil route sebelum upload gambar.
func (in MerchInput) Validate(creating bool) error {
	if creating && (in.Name == nil || *in.Name == "") {
		return fmt.Errorf("nama wajib diisi")
	}
	if in.Name != nil && (*in.Name == "" || len(*in.Name) > 150) {
		return fmt.Errorf("nama wajib diisi, maksimal 150 karakter")
	}
	if in.Price != nil && *in.Price < 0 {
		return fmt.Errorf("harga tidak boleh negatif")
	}
	if in.Category != nil && len(*in.Category) > 50 {
		return fmt.Errorf("kategori maksimal 50 karakter")
	}
	if in.OrderURL != nil && len(*in.OrderURL) > 512 {
		return fmt.Errorf("tautan pemesanan maksimal 512 karakter")
	}
	if in.OrderURL != nil && *in.OrderURL != "" {
		l := strings.ToLower(*in.OrderURL)
		if !strings.HasPrefix(l, "http://") && !strings.HasPrefix(l, "https://") {
			return fmt.Errorf("tautan pemesanan harus diawali http:// atau https://")
		}
	}
	if in.StockStatus != nil && !ValidStockStatus(*in.StockStatus) {
		return fmt.Errorf("stock_status harus ready, preorder, atau soldout")
	}
	return nil
}

func (MerchService) Create(ctx context.Context, in MerchInput) (*models.MerchItem, error) {
	if err := in.Validate(true); err != nil {
		return nil, err
	}
	m := &models.MerchItem{Name: *in.Name, Category: "Apparel", IsActive: true, StockStatus: "ready"}
	if in.Description != nil {
		m.Description = *in.Description
	}
	if in.Price != nil {
		m.Price = *in.Price
	}
	if in.OrderURL != nil {
		m.OrderURL = *in.OrderURL
	}
	if in.Category != nil && *in.Category != "" {
		m.Category = *in.Category
	}
	if in.StockStatus != nil && *in.StockStatus != "" {
		m.StockStatus = *in.StockStatus
	}
	if in.SortOrder != nil {
		m.SortOrder = *in.SortOrder
	}
	if in.IsActive != nil {
		m.IsActive = *in.IsActive
	}
	if in.ImageURL != nil {
		m.ImageURL = *in.ImageURL
	}
	return orm.Create(ctx, m)
}

func (s MerchService) Update(ctx context.Context, id int64, in MerchInput) (*models.MerchItem, error) {
	if err := in.Validate(false); err != nil {
		return nil, err
	}
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	vals := map[string]any{}
	if in.Name != nil {
		vals["name"] = *in.Name
	}
	if in.Description != nil {
		vals["description"] = *in.Description
	}
	if in.Price != nil {
		vals["price"] = *in.Price
	}
	if in.OrderURL != nil {
		vals["order_url"] = *in.OrderURL
	}
	if in.Category != nil && *in.Category != "" {
		vals["category"] = *in.Category
	}
	if in.StockStatus != nil && *in.StockStatus != "" {
		vals["stock_status"] = *in.StockStatus
	}
	if in.SortOrder != nil {
		vals["sort_order"] = *in.SortOrder
	}
	if in.IsActive != nil {
		vals["is_active"] = *in.IsActive
	}
	if in.ImageURL != nil {
		vals["image_url"] = *in.ImageURL
	} else if in.RemoveImage {
		vals["image_url"] = ""
	}
	if len(vals) == 0 {
		return cur, nil
	}
	return orm.UpdateByID[models.MerchItem](ctx, id, vals)
}

func (MerchService) Get(ctx context.Context, id int64) (*models.MerchItem, error) {
	m, err := orm.GetByID[models.MerchItem](ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	return m, err
}

func (MerchService) ListAll(ctx context.Context) ([]*models.MerchItem, error) {
	return orm.Objects[models.MerchItem](ctx).OrderBy("sort_order", "id").All()
}

func (MerchService) ListActive(ctx context.Context) ([]*models.MerchItem, error) {
	return orm.Objects[models.MerchItem](ctx).Filter("is_active", true).OrderBy("sort_order", "id").All()
}

func (s MerchService) Delete(ctx context.Context, id int64) error {
	if _, err := s.Get(ctx, id); err != nil {
		return err
	}
	_, err := orm.DeleteByID[models.MerchItem](ctx, id)
	return err
}
