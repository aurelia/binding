System.config({
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js",
    "aurelia-binding/*": "dist/*.js"
  }
});

System.config({
  "map": {
    "aurelia-metadata": "github:aurelia/metadata@0.3.0",
    "aurelia-task-queue": "github:aurelia/task-queue@0.2.2"
  }
});

