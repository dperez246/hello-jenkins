#!/usr/bin/env node

// No deshabiliten reglas de eslint
/* eslint-disable import/no-extraneous-dependencies */
const requireCommon = require('esm')(module)

requireCommon('./cli').cli(process.argv)
