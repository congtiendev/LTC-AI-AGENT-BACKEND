'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase token column size from VARCHAR(255) to TEXT
    await queryInterface.changeColumn('RefreshTokens', 'token', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert token column back to VARCHAR(255)
    await queryInterface.changeColumn('RefreshTokens', 'token', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  }
};
