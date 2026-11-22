-- +migrate Up
-- Konten publik landing page: siaran pers (press release) dan merchandise.
CREATE TABLE IF NOT EXISTS press_release (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    excerpt VARCHAR(500) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    cover_url VARCHAR(512) NOT NULL DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'Siaran Pers',
    published BOOLEAN NOT NULL DEFAULT FALSE,
    -- Diisi sekali saat pertama kali published; NULL = belum pernah terbit.
    published_at TIMESTAMPTZ,
    -- ON DELETE SET NULL: menghapus user tidak boleh menghapus beritanya.
    created_by_id BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_release_created_by_id ON press_release(created_by_id);
CREATE INDEX IF NOT EXISTS idx_press_release_published ON press_release(published, published_at DESC);

CREATE TABLE IF NOT EXISTS merch_item (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price BIGINT NOT NULL DEFAULT 0,
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    order_url VARCHAR(512) NOT NULL DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'Apparel',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    stock_status VARCHAR(20) NOT NULL DEFAULT 'ready',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merch_item_active_sort ON merch_item(is_active, sort_order);

INSERT INTO permission (code, module, description, created_at, updated_at) VALUES
('press_release.manage', 'press_release', 'Mengelola press release (draft, publikasi, hapus)', NOW(), NOW()),
('merch.manage', 'merch', 'Mengelola katalog merchandise', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Role Admin (system) memegang seluruh permission; role lain tidak diberi otomatis.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.is_system = TRUE
  AND p.code IN ('press_release.manage', 'merch.manage')
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM role_permission
WHERE permission_id IN (SELECT id FROM permission WHERE code IN ('press_release.manage', 'merch.manage'));
DELETE FROM permission WHERE code IN ('press_release.manage', 'merch.manage');
DROP TABLE IF EXISTS merch_item;
DROP TABLE IF EXISTS press_release;
