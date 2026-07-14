/**
 * Migration: groups 表新增 owner_id 欄位
 * 目的：群組改名 / 刪除權限控管（僅建立者可操作）
 * 注意：既有群組的 owner_id 為 NULL（建立者不可考），NULL 視為無人可管理
 */

exports.up = (pgm) => {
  pgm.addColumn('groups', {
    owner_id: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'SET NULL',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('groups', 'owner_id');
};
