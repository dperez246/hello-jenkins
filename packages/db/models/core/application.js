module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    'Application',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      route: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(36),
        allowNull: true,
        unique: false,
      },
      logo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      loginUserPassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      loginSignature: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      clonableDocuments: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'Applications',
    }
  )

  return Application
}
