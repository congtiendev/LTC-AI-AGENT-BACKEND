'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm cột avatar vào bảng Users
    await queryInterface.addColumn('Users', 'avatar', {
      type: Sequelize.STRING(500), // Lưu đường dẫn file hoặc URL
      allowNull: true, // Cho phép null vì không bắt buộc
      defaultValue: null,
      comment: 'Avatar image path or URL'
    });

    // Tạo index cho cột avatar để tối ưu query (nếu cần)
    // await queryInterface.addIndex('Users', ['avatar'], {
    //   name: 'idx_users_avatar'
    // });
  },

  async down(queryInterface, _Sequelize) {
    // Xóa index trước (nếu có tạo)
    // await queryInterface.removeIndex('Users', 'idx_users_avatar');

    // Xóa cột avatar khỏi bảng Users
    await queryInterface.removeColumn('Users', 'avatar');
  }
};
