"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentFormat = exports.TournamentStatus = void 0;
// Use Prisma's enum directly
var client_1 = require("@prisma/client");
Object.defineProperty(exports, "TournamentStatus", { enumerable: true, get: function () { return client_1.TournamentStatus; } });
// Define tournament formats as a proper enum
var TournamentFormat;
(function (TournamentFormat) {
    TournamentFormat["SINGLE_ELIMINATION"] = "SINGLE_ELIMINATION";
    TournamentFormat["DOUBLE_ELIMINATION"] = "DOUBLE_ELIMINATION";
    TournamentFormat["ROUND_ROBIN"] = "ROUND_ROBIN";
    TournamentFormat["SWISS"] = "SWISS";
    TournamentFormat["CUSTOM"] = "CUSTOM";
})(TournamentFormat || (exports.TournamentFormat = TournamentFormat = {}));
// Add other specific types as needed...
