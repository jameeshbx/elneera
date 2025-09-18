import { addMatchImageSnapshotPlugin } from "cypress-image-snapshot/plugin";

export default (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) => {
  addMatchImageSnapshotPlugin(on, config);
};
