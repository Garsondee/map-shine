export class UserGuide extends Application {
  constructor(options = {}) {
    super(options);
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      id: "map-shine-user-guide",
      title: "Map Shine User Guide",
      template: "modules/map-shine/templates/guide.html",
      width: 600,
      height: 700,
      resizable: true,
      classes: ["map-shine-user-guide-app"],
    };
  }

  async close(options) {
    game.mapShine.userGuide = null;
    return super.close(options);
  }
}

class _MapShineGuideContent {
  static async getHTML() {
    return renderTemplate("modules/map-shine/templates/guide.html");
  }
}