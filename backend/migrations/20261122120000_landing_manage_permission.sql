-- +migrate Up
-- Permission terpisah untuk mengatur section landing page (lepas dari settings.manage).
INSERT INTO permission (code, module, description, created_at, updated_at) VALUES
('landing.manage', 'landing', 'Mengatur section yang tampil di landing page', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.is_system = TRUE
  AND p.code = 'landing.manage'
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM role_permission
WHERE permission_id IN (SELECT id FROM permission WHERE code = 'landing.manage');
DELETE FROM permission WHERE code = 'landing.manage';
