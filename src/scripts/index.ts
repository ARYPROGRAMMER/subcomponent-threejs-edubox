/** @format */
import ThreeApp from './modules/ThreeApp';

export function startDroplets(container: HTMLElement) {
  const app = new ThreeApp(container);
  app.init();
  app.setup();
  app.render();
}
