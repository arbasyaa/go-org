// Package idlist menormalkan daftar ID dari input HTTP (form berulang, string
// berkoma, atau array JSON) supaya route tidak masing-masing menulis parser.
package idlist

import (
	"strconv"
	"strings"
)

// Parse membaca nilai form berulang (?ids=1&ids=2) maupun satu nilai berkoma ("1,2").
func Parse(values []string) []int64 {
	out := []int64{}
	for _, v := range values {
		for _, part := range strings.Split(v, ",") {
			part = strings.TrimSpace(part)
			if part == "" {
				continue
			}
			id, err := strconv.ParseInt(part, 10, 64)
			if err != nil || id <= 0 {
				continue
			}
			out = append(out, id)
		}
	}
	return out
}

// FromAny menormalkan nilai JSON ([]any berisi float64) jadi []int64.
func FromAny(raw any) []int64 {
	switch list := raw.(type) {
	case []any:
		out := []int64{}
		for _, item := range list {
			if f, ok := item.(float64); ok && f > 0 {
				out = append(out, int64(f))
			}
		}
		return out
	case []int64:
		return list
	case string:
		return Parse([]string{list})
	}
	return []int64{}
}
