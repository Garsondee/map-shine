(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/pixi-particles/lib/pixi-particles.es.js
  var pixi_particles_es_exports = {};
  __export(pixi_particles_es_exports, {
    AnimatedParticle: () => AnimatedParticle,
    Emitter: () => Emitter,
    GetTextureFromString: () => GetTextureFromString,
    LinkedListContainer: () => LinkedListContainer,
    Particle: () => Particle,
    ParticleUtils: () => ParticleUtils,
    PathParticle: () => PathParticle,
    PolygonalChain: () => PolygonalChain,
    PropertyList: () => PropertyList,
    PropertyNode: () => PropertyNode
  });
  var pixi = __toESM(__require("pixi.js"));
  var import_pixi = __require("pixi.js");
  var PropertyNode = (
    /** @class */
    function() {
      function PropertyNode2(value, time, ease) {
        this.value = value;
        this.time = time;
        this.next = null;
        this.isStepped = false;
        if (ease) {
          this.ease = typeof ease === "function" ? ease : ParticleUtils.generateEase(ease);
        } else {
          this.ease = null;
        }
      }
      PropertyNode2.createList = function(data) {
        if ("list" in data) {
          var array = data.list;
          var node = void 0;
          var _a = array[0], value = _a.value, time = _a.time;
          var first = node = new PropertyNode2(typeof value === "string" ? ParticleUtils.hexToRGB(value) : value, time, data.ease);
          if (array.length > 2 || array.length === 2 && array[1].value !== value) {
            for (var i = 1; i < array.length; ++i) {
              var _b = array[i], value_1 = _b.value, time_1 = _b.time;
              node.next = new PropertyNode2(typeof value_1 === "string" ? ParticleUtils.hexToRGB(value_1) : value_1, time_1);
              node = node.next;
            }
          }
          first.isStepped = !!data.isStepped;
          return first;
        }
        var start = new PropertyNode2(typeof data.start === "string" ? ParticleUtils.hexToRGB(data.start) : data.start, 0);
        if (data.end !== data.start) {
          start.next = new PropertyNode2(typeof data.end === "string" ? ParticleUtils.hexToRGB(data.end) : data.end, 1);
        }
        return start;
      };
      return PropertyNode2;
    }()
  );
  var TextureFromString;
  var pixiNS = pixi;
  if (parseInt(/^(\d+)\./.exec(import_pixi.VERSION)[1], 10) < 5) {
    TextureFromString = pixiNS.Texture.fromImage;
  } else {
    TextureFromString = pixiNS.Texture.from;
  }
  function GetTextureFromString(s) {
    return TextureFromString(s);
  }
  var ParticleUtils;
  (function(ParticleUtils2) {
    ParticleUtils2.verbose = false;
    ParticleUtils2.DEG_TO_RADS = Math.PI / 180;
    function rotatePoint(angle, p) {
      if (!angle)
        return;
      angle *= ParticleUtils2.DEG_TO_RADS;
      var s = Math.sin(angle);
      var c = Math.cos(angle);
      var xnew = p.x * c - p.y * s;
      var ynew = p.x * s + p.y * c;
      p.x = xnew;
      p.y = ynew;
    }
    ParticleUtils2.rotatePoint = rotatePoint;
    function combineRGBComponents(r, g, b) {
      return (
        /* a << 24 |*/
        r << 16 | g << 8 | b
      );
    }
    ParticleUtils2.combineRGBComponents = combineRGBComponents;
    function normalize(point) {
      var oneOverLen = 1 / ParticleUtils2.length(point);
      point.x *= oneOverLen;
      point.y *= oneOverLen;
    }
    ParticleUtils2.normalize = normalize;
    function scaleBy(point, value) {
      point.x *= value;
      point.y *= value;
    }
    ParticleUtils2.scaleBy = scaleBy;
    function length(point) {
      return Math.sqrt(point.x * point.x + point.y * point.y);
    }
    ParticleUtils2.length = length;
    function hexToRGB(color, output) {
      if (!output) {
        output = {};
      }
      if (color.charAt(0) === "#") {
        color = color.substr(1);
      } else if (color.indexOf("0x") === 0) {
        color = color.substr(2);
      }
      var alpha;
      if (color.length === 8) {
        alpha = color.substr(0, 2);
        color = color.substr(2);
      }
      output.r = parseInt(color.substr(0, 2), 16);
      output.g = parseInt(color.substr(2, 2), 16);
      output.b = parseInt(color.substr(4, 2), 16);
      if (alpha) {
        output.a = parseInt(alpha, 16);
      }
      return output;
    }
    ParticleUtils2.hexToRGB = hexToRGB;
    function generateEase(segments) {
      var qty = segments.length;
      var oneOverQty = 1 / qty;
      return function(time) {
        var i = qty * time | 0;
        var t = (time - i * oneOverQty) * qty;
        var s = segments[i] || segments[qty - 1];
        return s.s + t * (2 * (1 - t) * (s.cp - s.s) + t * (s.e - s.s));
      };
    }
    ParticleUtils2.generateEase = generateEase;
    function getBlendMode(name) {
      if (!name)
        return import_pixi.BLEND_MODES.NORMAL;
      name = name.toUpperCase();
      while (name.indexOf(" ") >= 0) {
        name = name.replace(" ", "_");
      }
      return import_pixi.BLEND_MODES[name] || import_pixi.BLEND_MODES.NORMAL;
    }
    ParticleUtils2.getBlendMode = getBlendMode;
    function createSteppedGradient(list, numSteps) {
      if (numSteps === void 0) {
        numSteps = 10;
      }
      if (typeof numSteps !== "number" || numSteps <= 0) {
        numSteps = 10;
      }
      var first = new PropertyNode(ParticleUtils2.hexToRGB(list[0].value), list[0].time);
      first.isStepped = true;
      var currentNode = first;
      var current = list[0];
      var nextIndex = 1;
      var next = list[nextIndex];
      for (var i = 1; i < numSteps; ++i) {
        var lerp = i / numSteps;
        while (lerp > next.time) {
          current = next;
          next = list[++nextIndex];
        }
        lerp = (lerp - current.time) / (next.time - current.time);
        var curVal = ParticleUtils2.hexToRGB(current.value);
        var nextVal = ParticleUtils2.hexToRGB(next.value);
        var output = {
          r: (nextVal.r - curVal.r) * lerp + curVal.r,
          g: (nextVal.g - curVal.g) * lerp + curVal.g,
          b: (nextVal.b - curVal.b) * lerp + curVal.b
        };
        currentNode.next = new PropertyNode(output, i / numSteps);
        currentNode = currentNode.next;
      }
      return first;
    }
    ParticleUtils2.createSteppedGradient = createSteppedGradient;
  })(ParticleUtils || (ParticleUtils = {}));
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  function intValueSimple(lerp) {
    if (this.ease) {
      lerp = this.ease(lerp);
    }
    return (this.next.value - this.current.value) * lerp + this.current.value;
  }
  function intColorSimple(lerp) {
    if (this.ease) {
      lerp = this.ease(lerp);
    }
    var curVal = this.current.value;
    var nextVal = this.next.value;
    var r = (nextVal.r - curVal.r) * lerp + curVal.r;
    var g = (nextVal.g - curVal.g) * lerp + curVal.g;
    var b = (nextVal.b - curVal.b) * lerp + curVal.b;
    return ParticleUtils.combineRGBComponents(r, g, b);
  }
  function intValueComplex(lerp) {
    if (this.ease) {
      lerp = this.ease(lerp);
    }
    while (lerp > this.next.time) {
      this.current = this.next;
      this.next = this.next.next;
    }
    lerp = (lerp - this.current.time) / (this.next.time - this.current.time);
    return (this.next.value - this.current.value) * lerp + this.current.value;
  }
  function intColorComplex(lerp) {
    if (this.ease) {
      lerp = this.ease(lerp);
    }
    while (lerp > this.next.time) {
      this.current = this.next;
      this.next = this.next.next;
    }
    lerp = (lerp - this.current.time) / (this.next.time - this.current.time);
    var curVal = this.current.value;
    var nextVal = this.next.value;
    var r = (nextVal.r - curVal.r) * lerp + curVal.r;
    var g = (nextVal.g - curVal.g) * lerp + curVal.g;
    var b = (nextVal.b - curVal.b) * lerp + curVal.b;
    return ParticleUtils.combineRGBComponents(r, g, b);
  }
  function intValueStepped(lerp) {
    if (this.ease) {
      lerp = this.ease(lerp);
    }
    while (this.next && lerp > this.next.time) {
      this.current = this.next;
      this.next = this.next.next;
    }
    return this.current.value;
  }
  function intColorStepped(lerp) {
    if (this.ease) {
      lerp = this.ease(lerp);
    }
    while (this.next && lerp > this.next.time) {
      this.current = this.next;
      this.next = this.next.next;
    }
    var curVal = this.current.value;
    return ParticleUtils.combineRGBComponents(curVal.r, curVal.g, curVal.b);
  }
  var PropertyList = (
    /** @class */
    function() {
      function PropertyList2(isColor) {
        if (isColor === void 0) {
          isColor = false;
        }
        this.current = null;
        this.next = null;
        this.isColor = !!isColor;
        this.interpolate = null;
        this.ease = null;
      }
      PropertyList2.prototype.reset = function(first) {
        this.current = first;
        this.next = first.next;
        var isSimple = this.next && this.next.time >= 1;
        if (isSimple) {
          this.interpolate = this.isColor ? intColorSimple : intValueSimple;
        } else if (first.isStepped) {
          this.interpolate = this.isColor ? intColorStepped : intValueStepped;
        } else {
          this.interpolate = this.isColor ? intColorComplex : intValueComplex;
        }
        this.ease = this.current.ease;
      };
      return PropertyList2;
    }()
  );
  var Particle = (
    /** @class */
    function(_super) {
      __extends(Particle2, _super);
      function Particle2(emitter) {
        var _this = (
          // start off the sprite with a blank texture, since we are going to replace it
          // later when the particle is initialized.
          _super.call(this) || this
        );
        _this.prevChild = _this.nextChild = null;
        _this.emitter = emitter;
        _this.anchor.x = _this.anchor.y = 0.5;
        _this.velocity = new import_pixi.Point();
        _this.rotationSpeed = 0;
        _this.rotationAcceleration = 0;
        _this.maxLife = 0;
        _this.age = 0;
        _this.ease = null;
        _this.extraData = null;
        _this.alphaList = new PropertyList();
        _this.speedList = new PropertyList();
        _this.speedMultiplier = 1;
        _this.acceleration = new import_pixi.Point();
        _this.maxSpeed = NaN;
        _this.scaleList = new PropertyList();
        _this.scaleMultiplier = 1;
        _this.colorList = new PropertyList(true);
        _this._doAlpha = false;
        _this._doScale = false;
        _this._doSpeed = false;
        _this._doAcceleration = false;
        _this._doColor = false;
        _this._doNormalMovement = false;
        _this._oneOverLife = 0;
        _this.next = null;
        _this.prev = null;
        _this.init = _this.init;
        _this.Particle_init = Particle2.prototype.init;
        _this.update = _this.update;
        _this.Particle_update = Particle2.prototype.update;
        _this.Sprite_destroy = _super.prototype.destroy;
        _this.Particle_destroy = Particle2.prototype.destroy;
        _this.applyArt = _this.applyArt;
        _this.kill = _this.kill;
        return _this;
      }
      Particle2.prototype.init = function() {
        this.age = 0;
        this.velocity.x = this.speedList.current.value * this.speedMultiplier;
        this.velocity.y = 0;
        ParticleUtils.rotatePoint(this.rotation, this.velocity);
        if (this.noRotation) {
          this.rotation = 0;
        } else {
          this.rotation *= ParticleUtils.DEG_TO_RADS;
        }
        this.rotationSpeed *= ParticleUtils.DEG_TO_RADS;
        this.rotationAcceleration *= ParticleUtils.DEG_TO_RADS;
        this.alpha = this.alphaList.current.value;
        this.scale.x = this.scale.y = this.scaleList.current.value;
        this._doAlpha = !!this.alphaList.current.next;
        this._doSpeed = !!this.speedList.current.next;
        this._doScale = !!this.scaleList.current.next;
        this._doColor = !!this.colorList.current.next;
        this._doAcceleration = this.acceleration.x !== 0 || this.acceleration.y !== 0;
        this._doNormalMovement = this._doSpeed || this.speedList.current.value !== 0 || this._doAcceleration;
        this._oneOverLife = 1 / this.maxLife;
        var color = this.colorList.current.value;
        this.tint = ParticleUtils.combineRGBComponents(color.r, color.g, color.b);
        this.visible = true;
      };
      Particle2.prototype.applyArt = function(art) {
        this.texture = art || import_pixi.Texture.EMPTY;
      };
      Particle2.prototype.update = function(delta) {
        this.age += delta;
        if (this.age >= this.maxLife || this.age < 0) {
          this.kill();
          return -1;
        }
        var lerp = this.age * this._oneOverLife;
        if (this.ease) {
          if (this.ease.length === 4) {
            lerp = this.ease(lerp, 0, 1, 1);
          } else {
            lerp = this.ease(lerp);
          }
        }
        if (this._doAlpha) {
          this.alpha = this.alphaList.interpolate(lerp);
        }
        if (this._doScale) {
          var scale = this.scaleList.interpolate(lerp) * this.scaleMultiplier;
          this.scale.x = this.scale.y = scale;
        }
        if (this._doNormalMovement) {
          var deltaX = void 0;
          var deltaY = void 0;
          if (this._doSpeed) {
            var speed = this.speedList.interpolate(lerp) * this.speedMultiplier;
            ParticleUtils.normalize(this.velocity);
            ParticleUtils.scaleBy(this.velocity, speed);
            deltaX = this.velocity.x * delta;
            deltaY = this.velocity.y * delta;
          } else if (this._doAcceleration) {
            var oldVX = this.velocity.x;
            var oldVY = this.velocity.y;
            this.velocity.x += this.acceleration.x * delta;
            this.velocity.y += this.acceleration.y * delta;
            if (this.maxSpeed) {
              var currentSpeed = ParticleUtils.length(this.velocity);
              if (currentSpeed > this.maxSpeed) {
                ParticleUtils.scaleBy(this.velocity, this.maxSpeed / currentSpeed);
              }
            }
            deltaX = (oldVX + this.velocity.x) / 2 * delta;
            deltaY = (oldVY + this.velocity.y) / 2 * delta;
          } else {
            deltaX = this.velocity.x * delta;
            deltaY = this.velocity.y * delta;
          }
          this.position.x += deltaX;
          this.position.y += deltaY;
        }
        if (this._doColor) {
          this.tint = this.colorList.interpolate(lerp);
        }
        if (this.rotationAcceleration !== 0) {
          var newRotationSpeed = this.rotationSpeed + this.rotationAcceleration * delta;
          this.rotation += (this.rotationSpeed + newRotationSpeed) / 2 * delta;
          this.rotationSpeed = newRotationSpeed;
        } else if (this.rotationSpeed !== 0) {
          this.rotation += this.rotationSpeed * delta;
        } else if (this.acceleration && !this.noRotation) {
          this.rotation = Math.atan2(this.velocity.y, this.velocity.x);
        }
        return lerp;
      };
      Particle2.prototype.kill = function() {
        this.emitter.recycle(this);
      };
      Particle2.prototype.destroy = function() {
        if (this.parent) {
          this.parent.removeChild(this);
        }
        this.Sprite_destroy();
        this.emitter = this.velocity = this.colorList = this.scaleList = this.alphaList = this.speedList = this.ease = this.next = this.prev = null;
      };
      Particle2.parseArt = function(art) {
        var i;
        for (i = art.length; i >= 0; --i) {
          if (typeof art[i] === "string") {
            art[i] = GetTextureFromString(art[i]);
          }
        }
        if (ParticleUtils.verbose) {
          for (i = art.length - 1; i > 0; --i) {
            if (art[i].baseTexture !== art[i - 1].baseTexture) {
              if (window.console) {
                console.warn("PixiParticles: using particle textures from different images may hinder performance in WebGL");
              }
              break;
            }
          }
        }
        return art;
      };
      Particle2.parseData = function(extraData) {
        return extraData;
      };
      return Particle2;
    }(import_pixi.Sprite)
  );
  var PolygonalChain = (
    /** @class */
    function() {
      function PolygonalChain2(data) {
        this.segments = [];
        this.countingLengths = [];
        this.totalLength = 0;
        this.init(data);
      }
      PolygonalChain2.prototype.init = function(data) {
        if (!data || !data.length) {
          this.segments.push({ p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 }, l: 0 });
        } else if (Array.isArray(data[0])) {
          for (var i = 0; i < data.length; ++i) {
            var chain = data[i];
            var prevPoint = chain[0];
            for (var j = 1; j < chain.length; ++j) {
              var second = chain[j];
              this.segments.push({ p1: prevPoint, p2: second, l: 0 });
              prevPoint = second;
            }
          }
        } else {
          var prevPoint = data[0];
          for (var i = 1; i < data.length; ++i) {
            var second = data[i];
            this.segments.push({ p1: prevPoint, p2: second, l: 0 });
            prevPoint = second;
          }
        }
        for (var i = 0; i < this.segments.length; ++i) {
          var _a = this.segments[i], p1 = _a.p1, p2 = _a.p2;
          var segLength = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
          this.segments[i].l = segLength;
          this.totalLength += segLength;
          this.countingLengths.push(this.totalLength);
        }
      };
      PolygonalChain2.prototype.getRandomPoint = function(out) {
        var rand = Math.random() * this.totalLength;
        var chosenSeg;
        var lerp;
        if (this.segments.length === 1) {
          chosenSeg = this.segments[0];
          lerp = rand;
        } else {
          for (var i = 0; i < this.countingLengths.length; ++i) {
            if (rand < this.countingLengths[i]) {
              chosenSeg = this.segments[i];
              lerp = i === 0 ? rand : rand - this.countingLengths[i - 1];
              break;
            }
          }
        }
        lerp /= chosenSeg.l || 1;
        var p1 = chosenSeg.p1, p2 = chosenSeg.p2;
        out.x = p1.x + lerp * (p2.x - p1.x);
        out.y = p1.y + lerp * (p2.y - p1.y);
      };
      return PolygonalChain2;
    }()
  );
  var ticker;
  var pixiNS$1 = pixi;
  if (parseInt(/^(\d+)\./.exec(import_pixi.VERSION)[1], 10) < 5) {
    ticker = pixiNS$1.ticker.shared;
  } else {
    ticker = pixiNS$1.Ticker.shared;
  }
  var helperPoint = new import_pixi.Point();
  var Emitter = (
    /** @class */
    function() {
      function Emitter2(particleParent, particleImages, config) {
        this._currentImageIndex = -1;
        this._particleConstructor = Particle;
        this.particleImages = null;
        this.startAlpha = null;
        this.startSpeed = null;
        this.minimumSpeedMultiplier = 1;
        this.acceleration = null;
        this.maxSpeed = NaN;
        this.startScale = null;
        this.minimumScaleMultiplier = 1;
        this.startColor = null;
        this.minLifetime = 0;
        this.maxLifetime = 0;
        this.minStartRotation = 0;
        this.maxStartRotation = 0;
        this.noRotation = false;
        this.minRotationSpeed = 0;
        this.maxRotationSpeed = 0;
        this.particleBlendMode = 0;
        this.customEase = null;
        this.extraData = null;
        this._frequency = 1;
        this.spawnChance = 1;
        this.maxParticles = 1e3;
        this.emitterLifetime = -1;
        this.spawnPos = null;
        this.spawnType = null;
        this._spawnFunc = null;
        this.spawnRect = null;
        this.spawnCircle = null;
        this.spawnPolygonalChain = null;
        this.particlesPerWave = 1;
        this.particleSpacing = 0;
        this.angleStart = 0;
        this.rotation = 0;
        this.ownerPos = null;
        this._prevEmitterPos = null;
        this._prevPosIsValid = false;
        this._posChanged = false;
        this._parent = null;
        this.addAtBack = false;
        this.particleCount = 0;
        this._emit = false;
        this._spawnTimer = 0;
        this._emitterLife = -1;
        this._activeParticlesFirst = null;
        this._activeParticlesLast = null;
        this._poolFirst = null;
        this._origConfig = null;
        this._origArt = null;
        this._autoUpdate = false;
        this._currentImageIndex = -1;
        this._destroyWhenComplete = false;
        this._completeCallback = null;
        this.parent = particleParent;
        if (particleImages && config) {
          this.init(particleImages, config);
        }
        this.recycle = this.recycle;
        this.update = this.update;
        this.rotate = this.rotate;
        this.updateSpawnPos = this.updateSpawnPos;
        this.updateOwnerPos = this.updateOwnerPos;
      }
      Object.defineProperty(Emitter2.prototype, "orderedArt", {
        /**
         * If the emitter is using particle art in order as provided in `particleImages`.
         * Effective only when `particleImages` has multiple art options.
         * This is particularly useful ensuring that each art shows up once, in case you need to emit a body in an order.
         * For example: dragon - [Head, body1, body2, ..., tail]
         */
        get: function() {
          return this._currentImageIndex !== -1;
        },
        set: function(value) {
          this._currentImageIndex = value ? 0 : -1;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(Emitter2.prototype, "frequency", {
        /**
         * Time between particle spawns in seconds. If this value is not a number greater than 0,
         * it will be set to 1 (particle per second) to prevent infinite loops.
         */
        get: function() {
          return this._frequency;
        },
        set: function(value) {
          if (typeof value === "number" && value > 0) {
            this._frequency = value;
          } else {
            this._frequency = 1;
          }
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(Emitter2.prototype, "particleConstructor", {
        /**
         * The constructor used to create new particles. The default is
         * the built in Particle class. Setting this will dump any active or
         * pooled particles, if the emitter has already been used.
         */
        get: function() {
          return this._particleConstructor;
        },
        set: function(value) {
          if (value !== this._particleConstructor) {
            this._particleConstructor = value;
            this.cleanup();
            for (var particle = this._poolFirst; particle; particle = particle.next) {
              particle.destroy();
            }
            this._poolFirst = null;
            if (this._origConfig && this._origArt) {
              this.init(this._origArt, this._origConfig);
            }
          }
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(Emitter2.prototype, "parent", {
        /**
        * The container to add particles to. Settings this will dump any active particles.
        */
        get: function() {
          return this._parent;
        },
        set: function(value) {
          this.cleanup();
          this._parent = value;
        },
        enumerable: true,
        configurable: true
      });
      Emitter2.prototype.init = function(art, config) {
        if (!art || !config) {
          return;
        }
        this.cleanup();
        this._origConfig = config;
        this._origArt = art;
        art = Array.isArray(art) ? art.slice() : [art];
        var partClass = this._particleConstructor;
        this.particleImages = partClass.parseArt ? partClass.parseArt(art) : art;
        if (config.alpha) {
          this.startAlpha = PropertyNode.createList(config.alpha);
        } else {
          this.startAlpha = new PropertyNode(1, 0);
        }
        if (config.speed) {
          this.startSpeed = PropertyNode.createList(config.speed);
          this.minimumSpeedMultiplier = ("minimumSpeedMultiplier" in config ? config.minimumSpeedMultiplier : config.speed.minimumSpeedMultiplier) || 1;
        } else {
          this.minimumSpeedMultiplier = 1;
          this.startSpeed = new PropertyNode(0, 0);
        }
        var acceleration = config.acceleration;
        if (acceleration && (acceleration.x || acceleration.y)) {
          this.startSpeed.next = null;
          this.acceleration = new import_pixi.Point(acceleration.x, acceleration.y);
          this.maxSpeed = config.maxSpeed || NaN;
        } else {
          this.acceleration = new import_pixi.Point();
        }
        if (config.scale) {
          this.startScale = PropertyNode.createList(config.scale);
          this.minimumScaleMultiplier = ("minimumScaleMultiplier" in config ? config.minimumScaleMultiplier : config.scale.minimumScaleMultiplier) || 1;
        } else {
          this.startScale = new PropertyNode(1, 0);
          this.minimumScaleMultiplier = 1;
        }
        if (config.color) {
          this.startColor = PropertyNode.createList(config.color);
        } else {
          this.startColor = new PropertyNode({ r: 255, g: 255, b: 255 }, 0);
        }
        if (config.startRotation) {
          this.minStartRotation = config.startRotation.min;
          this.maxStartRotation = config.startRotation.max;
        } else {
          this.minStartRotation = this.maxStartRotation = 0;
        }
        if (config.noRotation && (this.minStartRotation || this.maxStartRotation)) {
          this.noRotation = !!config.noRotation;
        } else {
          this.noRotation = false;
        }
        if (config.rotationSpeed) {
          this.minRotationSpeed = config.rotationSpeed.min;
          this.maxRotationSpeed = config.rotationSpeed.max;
        } else {
          this.minRotationSpeed = this.maxRotationSpeed = 0;
        }
        this.rotationAcceleration = config.rotationAcceleration || 0;
        this.minLifetime = config.lifetime.min;
        this.maxLifetime = config.lifetime.max;
        this.particleBlendMode = ParticleUtils.getBlendMode(config.blendMode);
        if (config.ease) {
          this.customEase = typeof config.ease === "function" ? config.ease : ParticleUtils.generateEase(config.ease);
        } else {
          this.customEase = null;
        }
        if (partClass.parseData) {
          this.extraData = partClass.parseData(config.extraData);
        } else {
          this.extraData = config.extraData || null;
        }
        this.spawnRect = this.spawnCircle = null;
        this.particlesPerWave = 1;
        if (config.particlesPerWave && config.particlesPerWave > 1) {
          this.particlesPerWave = config.particlesPerWave;
        }
        this.particleSpacing = 0;
        this.angleStart = 0;
        this.parseSpawnType(config);
        this.frequency = config.frequency;
        this.spawnChance = typeof config.spawnChance === "number" && config.spawnChance > 0 ? config.spawnChance : 1;
        this.emitterLifetime = config.emitterLifetime || -1;
        this.maxParticles = config.maxParticles > 0 ? config.maxParticles : 1e3;
        this.addAtBack = !!config.addAtBack;
        this.rotation = 0;
        this.ownerPos = new import_pixi.Point();
        this.spawnPos = new import_pixi.Point(config.pos.x, config.pos.y);
        this.initAdditional(art, config);
        this._prevEmitterPos = this.spawnPos.clone();
        this._prevPosIsValid = false;
        this._spawnTimer = 0;
        this.emit = config.emit === void 0 ? true : !!config.emit;
        this.autoUpdate = !!config.autoUpdate;
        this.orderedArt = !!config.orderedArt;
      };
      Emitter2.prototype.initAdditional = function(art, config) {
      };
      Emitter2.prototype.parseSpawnType = function(config) {
        var spawnCircle;
        switch (config.spawnType) {
          case "rect":
            this.spawnType = "rect";
            this._spawnFunc = this._spawnRect;
            var spawnRect = config.spawnRect;
            this.spawnRect = new import_pixi.Rectangle(spawnRect.x, spawnRect.y, spawnRect.w, spawnRect.h);
            break;
          case "circle":
            this.spawnType = "circle";
            this._spawnFunc = this._spawnCircle;
            spawnCircle = config.spawnCircle;
            this.spawnCircle = new import_pixi.Circle(spawnCircle.x, spawnCircle.y, spawnCircle.r);
            break;
          case "ring":
            this.spawnType = "ring";
            this._spawnFunc = this._spawnRing;
            spawnCircle = config.spawnCircle;
            this.spawnCircle = new import_pixi.Circle(spawnCircle.x, spawnCircle.y, spawnCircle.r);
            this.spawnCircle.minRadius = spawnCircle.minR;
            break;
          case "burst":
            this.spawnType = "burst";
            this._spawnFunc = this._spawnBurst;
            this.particleSpacing = config.particleSpacing;
            this.angleStart = config.angleStart ? config.angleStart : 0;
            break;
          case "point":
            this.spawnType = "point";
            this._spawnFunc = this._spawnPoint;
            break;
          case "polygonalChain":
            this.spawnType = "polygonalChain";
            this._spawnFunc = this._spawnPolygonalChain;
            this.spawnPolygonalChain = new PolygonalChain(config.spawnPolygon);
            break;
          default:
            this.spawnType = "point";
            this._spawnFunc = this._spawnPoint;
            break;
        }
      };
      Emitter2.prototype.recycle = function(particle) {
        if (particle.next) {
          particle.next.prev = particle.prev;
        }
        if (particle.prev) {
          particle.prev.next = particle.next;
        }
        if (particle === this._activeParticlesLast) {
          this._activeParticlesLast = particle.prev;
        }
        if (particle === this._activeParticlesFirst) {
          this._activeParticlesFirst = particle.next;
        }
        particle.prev = null;
        particle.next = this._poolFirst;
        this._poolFirst = particle;
        if (particle.parent) {
          particle.parent.removeChild(particle);
        }
        --this.particleCount;
      };
      Emitter2.prototype.rotate = function(newRot) {
        if (this.rotation === newRot)
          return;
        var diff = newRot - this.rotation;
        this.rotation = newRot;
        ParticleUtils.rotatePoint(diff, this.spawnPos);
        this._posChanged = true;
      };
      Emitter2.prototype.updateSpawnPos = function(x, y) {
        this._posChanged = true;
        this.spawnPos.x = x;
        this.spawnPos.y = y;
      };
      Emitter2.prototype.updateOwnerPos = function(x, y) {
        this._posChanged = true;
        this.ownerPos.x = x;
        this.ownerPos.y = y;
      };
      Emitter2.prototype.resetPositionTracking = function() {
        this._prevPosIsValid = false;
      };
      Object.defineProperty(Emitter2.prototype, "emit", {
        /**
         * If particles should be emitted during update() calls. Setting this to false
         * stops new particles from being created, but allows existing ones to die out.
         */
        get: function() {
          return this._emit;
        },
        set: function(value) {
          this._emit = !!value;
          this._emitterLife = this.emitterLifetime;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(Emitter2.prototype, "autoUpdate", {
        /**
         * If the update function is called automatically from the shared ticker.
         * Setting this to false requires calling the update function manually.
         */
        get: function() {
          return this._autoUpdate;
        },
        set: function(value) {
          if (this._autoUpdate && !value) {
            ticker.remove(this.update, this);
          } else if (!this._autoUpdate && value) {
            ticker.add(this.update, this);
          }
          this._autoUpdate = !!value;
        },
        enumerable: true,
        configurable: true
      });
      Emitter2.prototype.playOnceAndDestroy = function(callback) {
        this.autoUpdate = true;
        this.emit = true;
        this._destroyWhenComplete = true;
        this._completeCallback = callback;
      };
      Emitter2.prototype.playOnce = function(callback) {
        this.emit = true;
        this._completeCallback = callback;
      };
      Emitter2.prototype.update = function(delta) {
        if (this._autoUpdate) {
          delta = delta / import_pixi.settings.TARGET_FPMS / 1e3;
        }
        if (!this._parent)
          return;
        var i;
        var particle;
        var next;
        for (particle = this._activeParticlesFirst; particle; particle = next) {
          next = particle.next;
          particle.update(delta);
        }
        var prevX;
        var prevY;
        if (this._prevPosIsValid) {
          prevX = this._prevEmitterPos.x;
          prevY = this._prevEmitterPos.y;
        }
        var curX = this.ownerPos.x + this.spawnPos.x;
        var curY = this.ownerPos.y + this.spawnPos.y;
        if (this._emit) {
          this._spawnTimer -= delta < 0 ? 0 : delta;
          while (this._spawnTimer <= 0) {
            if (this._emitterLife >= 0) {
              this._emitterLife -= this._frequency;
              if (this._emitterLife <= 0) {
                this._spawnTimer = 0;
                this._emitterLife = 0;
                this.emit = false;
                break;
              }
            }
            if (this.particleCount >= this.maxParticles) {
              this._spawnTimer += this._frequency;
              continue;
            }
            var lifetime = void 0;
            if (this.minLifetime === this.maxLifetime) {
              lifetime = this.minLifetime;
            } else {
              lifetime = Math.random() * (this.maxLifetime - this.minLifetime) + this.minLifetime;
            }
            if (-this._spawnTimer < lifetime) {
              var emitPosX = void 0;
              var emitPosY = void 0;
              if (this._prevPosIsValid && this._posChanged) {
                var lerp = 1 + this._spawnTimer / delta;
                emitPosX = (curX - prevX) * lerp + prevX;
                emitPosY = (curY - prevY) * lerp + prevY;
              } else {
                emitPosX = curX;
                emitPosY = curY;
              }
              i = 0;
              for (var len = Math.min(this.particlesPerWave, this.maxParticles - this.particleCount); i < len; ++i) {
                if (this.spawnChance < 1 && Math.random() >= this.spawnChance) {
                  continue;
                }
                var p = void 0;
                if (this._poolFirst) {
                  p = this._poolFirst;
                  this._poolFirst = this._poolFirst.next;
                  p.next = null;
                } else {
                  p = new this.particleConstructor(this);
                }
                if (this.particleImages.length > 1) {
                  if (this._currentImageIndex !== -1) {
                    p.applyArt(this.particleImages[this._currentImageIndex++]);
                    if (this._currentImageIndex < 0 || this._currentImageIndex >= this.particleImages.length) {
                      this._currentImageIndex = 0;
                    }
                  } else {
                    p.applyArt(this.particleImages[Math.floor(Math.random() * this.particleImages.length)]);
                  }
                } else {
                  p.applyArt(this.particleImages[0]);
                }
                p.alphaList.reset(this.startAlpha);
                if (this.minimumSpeedMultiplier !== 1) {
                  p.speedMultiplier = Math.random() * (1 - this.minimumSpeedMultiplier) + this.minimumSpeedMultiplier;
                }
                p.speedList.reset(this.startSpeed);
                p.acceleration.x = this.acceleration.x;
                p.acceleration.y = this.acceleration.y;
                p.maxSpeed = this.maxSpeed;
                if (this.minimumScaleMultiplier !== 1) {
                  p.scaleMultiplier = Math.random() * (1 - this.minimumScaleMultiplier) + this.minimumScaleMultiplier;
                }
                p.scaleList.reset(this.startScale);
                p.colorList.reset(this.startColor);
                if (this.minRotationSpeed === this.maxRotationSpeed) {
                  p.rotationSpeed = this.minRotationSpeed;
                } else {
                  p.rotationSpeed = Math.random() * (this.maxRotationSpeed - this.minRotationSpeed) + this.minRotationSpeed;
                }
                p.rotationAcceleration = this.rotationAcceleration;
                p.noRotation = this.noRotation;
                p.maxLife = lifetime;
                p.blendMode = this.particleBlendMode;
                p.ease = this.customEase;
                p.extraData = this.extraData;
                this.applyAdditionalProperties(p);
                this._spawnFunc(p, emitPosX, emitPosY, i);
                p.init();
                if (this.addAtBack) {
                  this._parent.addChildAt(p, 0);
                } else {
                  this._parent.addChild(p);
                }
                if (this._activeParticlesLast) {
                  this._activeParticlesLast.next = p;
                  p.prev = this._activeParticlesLast;
                  this._activeParticlesLast = p;
                } else {
                  this._activeParticlesLast = this._activeParticlesFirst = p;
                }
                ++this.particleCount;
                p.update(-this._spawnTimer);
              }
            }
            this._spawnTimer += this._frequency;
          }
        }
        if (this._posChanged) {
          this._prevEmitterPos.x = curX;
          this._prevEmitterPos.y = curY;
          this._prevPosIsValid = true;
          this._posChanged = false;
        }
        if (!this._emit && !this._activeParticlesFirst) {
          if (this._completeCallback) {
            var cb = this._completeCallback;
            this._completeCallback = null;
            cb();
          }
          if (this._destroyWhenComplete) {
            this.destroy();
          }
        }
      };
      Emitter2.prototype.applyAdditionalProperties = function(p) {
      };
      Emitter2.prototype._spawnPoint = function(p, emitPosX, emitPosY) {
        if (this.minStartRotation === this.maxStartRotation) {
          p.rotation = this.minStartRotation + this.rotation;
        } else {
          p.rotation = Math.random() * (this.maxStartRotation - this.minStartRotation) + this.minStartRotation + this.rotation;
        }
        p.position.x = emitPosX;
        p.position.y = emitPosY;
      };
      Emitter2.prototype._spawnRect = function(p, emitPosX, emitPosY) {
        if (this.minStartRotation === this.maxStartRotation) {
          p.rotation = this.minStartRotation + this.rotation;
        } else {
          p.rotation = Math.random() * (this.maxStartRotation - this.minStartRotation) + this.minStartRotation + this.rotation;
        }
        helperPoint.x = Math.random() * this.spawnRect.width + this.spawnRect.x;
        helperPoint.y = Math.random() * this.spawnRect.height + this.spawnRect.y;
        if (this.rotation !== 0) {
          ParticleUtils.rotatePoint(this.rotation, helperPoint);
        }
        p.position.x = emitPosX + helperPoint.x;
        p.position.y = emitPosY + helperPoint.y;
      };
      Emitter2.prototype._spawnCircle = function(p, emitPosX, emitPosY) {
        if (this.minStartRotation === this.maxStartRotation) {
          p.rotation = this.minStartRotation + this.rotation;
        } else {
          p.rotation = Math.random() * (this.maxStartRotation - this.minStartRotation) + this.minStartRotation + this.rotation;
        }
        helperPoint.x = Math.random() * this.spawnCircle.radius;
        helperPoint.y = 0;
        ParticleUtils.rotatePoint(Math.random() * 360, helperPoint);
        helperPoint.x += this.spawnCircle.x;
        helperPoint.y += this.spawnCircle.y;
        if (this.rotation !== 0) {
          ParticleUtils.rotatePoint(this.rotation, helperPoint);
        }
        p.position.x = emitPosX + helperPoint.x;
        p.position.y = emitPosY + helperPoint.y;
      };
      Emitter2.prototype._spawnRing = function(p, emitPosX, emitPosY) {
        var spawnCircle = this.spawnCircle;
        if (this.minStartRotation === this.maxStartRotation) {
          p.rotation = this.minStartRotation + this.rotation;
        } else {
          p.rotation = Math.random() * (this.maxStartRotation - this.minStartRotation) + this.minStartRotation + this.rotation;
        }
        if (spawnCircle.minRadius !== spawnCircle.radius) {
          helperPoint.x = Math.random() * (spawnCircle.radius - spawnCircle.minRadius) + spawnCircle.minRadius;
        } else {
          helperPoint.x = spawnCircle.radius;
        }
        helperPoint.y = 0;
        var angle = Math.random() * 360;
        p.rotation += angle;
        ParticleUtils.rotatePoint(angle, helperPoint);
        helperPoint.x += this.spawnCircle.x;
        helperPoint.y += this.spawnCircle.y;
        if (this.rotation !== 0) {
          ParticleUtils.rotatePoint(this.rotation, helperPoint);
        }
        p.position.x = emitPosX + helperPoint.x;
        p.position.y = emitPosY + helperPoint.y;
      };
      Emitter2.prototype._spawnPolygonalChain = function(p, emitPosX, emitPosY) {
        if (this.minStartRotation === this.maxStartRotation) {
          p.rotation = this.minStartRotation + this.rotation;
        } else {
          p.rotation = Math.random() * (this.maxStartRotation - this.minStartRotation) + this.minStartRotation + this.rotation;
        }
        this.spawnPolygonalChain.getRandomPoint(helperPoint);
        if (this.rotation !== 0) {
          ParticleUtils.rotatePoint(this.rotation, helperPoint);
        }
        p.position.x = emitPosX + helperPoint.x;
        p.position.y = emitPosY + helperPoint.y;
      };
      Emitter2.prototype._spawnBurst = function(p, emitPosX, emitPosY, i) {
        if (this.particleSpacing === 0) {
          p.rotation = Math.random() * 360;
        } else {
          p.rotation = this.angleStart + this.particleSpacing * i + this.rotation;
        }
        p.position.x = emitPosX;
        p.position.y = emitPosY;
      };
      Emitter2.prototype.cleanup = function() {
        var particle;
        var next;
        for (particle = this._activeParticlesFirst; particle; particle = next) {
          next = particle.next;
          this.recycle(particle);
          if (particle.parent) {
            particle.parent.removeChild(particle);
          }
        }
        this._activeParticlesFirst = this._activeParticlesLast = null;
        this.particleCount = 0;
      };
      Emitter2.prototype.destroy = function() {
        this.autoUpdate = false;
        this.cleanup();
        var next;
        for (var particle = this._poolFirst; particle; particle = next) {
          next = particle.next;
          particle.destroy();
        }
        this._poolFirst = this._parent = this.particleImages = this.spawnPos = this.ownerPos = this.startColor = this.startScale = this.startAlpha = this.startSpeed = this.customEase = this._completeCallback = null;
      };
      return Emitter2;
    }()
  );
  var helperPoint$1 = new import_pixi.Point();
  var MATH_FUNCS = [
    "pow",
    "sqrt",
    "abs",
    "floor",
    "round",
    "ceil",
    "E",
    "PI",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "atan2",
    "log"
  ];
  var WHITELISTER = new RegExp([
    // Allow the 4 basic operations, parentheses and all numbers/decimals, as well
    // as 'x', for the variable usage.
    "[01234567890\\.\\*\\-\\+\\/\\(\\)x ,]"
  ].concat(MATH_FUNCS).join("|"), "g");
  function parsePath(pathString) {
    var matches = pathString.match(WHITELISTER);
    for (var i = matches.length - 1; i >= 0; --i) {
      if (MATH_FUNCS.indexOf(matches[i]) >= 0) {
        matches[i] = "Math." + matches[i];
      }
    }
    pathString = matches.join("");
    return new Function("x", "return " + pathString + ";");
  }
  var PathParticle = (
    /** @class */
    function(_super) {
      __extends(PathParticle2, _super);
      function PathParticle2(emitter) {
        var _this = _super.call(this, emitter) || this;
        _this.path = null;
        _this.initialRotation = 0;
        _this.initialPosition = new import_pixi.Point();
        _this.movement = 0;
        return _this;
      }
      PathParticle2.prototype.init = function() {
        this.initialRotation = this.rotation;
        this.Particle_init();
        this.path = this.extraData.path;
        this._doNormalMovement = !this.path;
        this.movement = 0;
        this.initialPosition.x = this.position.x;
        this.initialPosition.y = this.position.y;
      };
      PathParticle2.prototype.update = function(delta) {
        var lerp = this.Particle_update(delta);
        if (lerp >= 0 && this.path) {
          if (this._doSpeed) {
            var speed = this.speedList.interpolate(lerp) * this.speedMultiplier;
            this.movement += speed * delta;
          } else {
            var speed = this.speedList.current.value * this.speedMultiplier;
            this.movement += speed * delta;
          }
          helperPoint$1.x = this.movement;
          helperPoint$1.y = this.path(this.movement);
          ParticleUtils.rotatePoint(this.initialRotation, helperPoint$1);
          this.position.x = this.initialPosition.x + helperPoint$1.x;
          this.position.y = this.initialPosition.y + helperPoint$1.y;
        }
        return lerp;
      };
      PathParticle2.prototype.destroy = function() {
        this.Particle_destroy();
        this.path = this.initialPosition = null;
      };
      PathParticle2.parseArt = function(art) {
        return Particle.parseArt(art);
      };
      PathParticle2.parseData = function(extraData) {
        var output = {};
        if (extraData && extraData.path) {
          try {
            output.path = parsePath(extraData.path);
          } catch (e) {
            if (ParticleUtils.verbose) {
              console.error("PathParticle: error in parsing path expression");
            }
            output.path = null;
          }
        } else {
          if (ParticleUtils.verbose) {
            console.error("PathParticle requires a path string in extraData!");
          }
          output.path = null;
        }
        return output;
      };
      return PathParticle2;
    }(Particle)
  );
  var AnimatedParticle = (
    /** @class */
    function(_super) {
      __extends(AnimatedParticle2, _super);
      function AnimatedParticle2(emitter) {
        var _this = _super.call(this, emitter) || this;
        _this.textures = null;
        _this.duration = 0;
        _this.framerate = 0;
        _this.elapsed = 0;
        _this.loop = false;
        return _this;
      }
      AnimatedParticle2.prototype.init = function() {
        this.Particle_init();
        this.elapsed = 0;
        if (this.framerate < 0) {
          this.duration = this.maxLife;
          this.framerate = this.textures.length / this.duration;
        }
      };
      AnimatedParticle2.prototype.applyArt = function(art) {
        this.textures = art.textures;
        this.framerate = art.framerate;
        this.duration = art.duration;
        this.loop = art.loop;
      };
      AnimatedParticle2.prototype.update = function(delta) {
        var lerp = this.Particle_update(delta);
        if (lerp >= 0) {
          this.elapsed += delta;
          if (this.elapsed >= this.duration) {
            if (this.loop) {
              this.elapsed = this.elapsed % this.duration;
            } else {
              this.elapsed = this.duration - 1e-6;
            }
          }
          var frame = this.elapsed * this.framerate + 1e-7 | 0;
          this.texture = this.textures[frame] || this.textures[this.textures.length - 1] || import_pixi.Texture.EMPTY;
        }
        return lerp;
      };
      AnimatedParticle2.prototype.destroy = function() {
        this.Particle_destroy();
        this.textures = null;
      };
      AnimatedParticle2.parseArt = function(art) {
        var outArr = [];
        for (var i = 0; i < art.length; ++i) {
          var data = art[i];
          var output = outArr[i] = {};
          var outTextures = output.textures = [];
          var textures = data.textures;
          for (var j = 0; j < textures.length; ++j) {
            var tex = textures[j];
            if (typeof tex === "string") {
              outTextures.push(GetTextureFromString(tex));
            } else if (tex instanceof import_pixi.Texture) {
              outTextures.push(tex);
            } else {
              var dupe = tex.count || 1;
              if (typeof tex.texture === "string") {
                tex = GetTextureFromString(tex.texture);
              } else {
                tex = tex.texture;
              }
              for (; dupe > 0; --dupe) {
                outTextures.push(tex);
              }
            }
          }
          if (data.framerate === "matchLife") {
            output.framerate = -1;
            output.duration = 0;
            output.loop = false;
          } else {
            output.loop = !!data.loop;
            output.framerate = data.framerate > 0 ? data.framerate : 60;
            output.duration = outTextures.length / output.framerate;
          }
        }
        return outArr;
      };
      return AnimatedParticle2;
    }(Particle)
  );
  var LinkedListContainer = (
    /** @class */
    function(_super) {
      __extends(LinkedListContainer2, _super);
      function LinkedListContainer2() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._firstChild = null;
        _this._lastChild = null;
        _this._childCount = 0;
        return _this;
      }
      Object.defineProperty(LinkedListContainer2.prototype, "firstChild", {
        get: function() {
          return this._firstChild;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(LinkedListContainer2.prototype, "lastChild", {
        get: function() {
          return this._lastChild;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(LinkedListContainer2.prototype, "childCount", {
        get: function() {
          return this._childCount;
        },
        enumerable: true,
        configurable: true
      });
      LinkedListContainer2.prototype.addChild = function() {
        var children = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          children[_i] = arguments[_i];
        }
        if (children.length > 1) {
          for (var i = 0; i < children.length; i++) {
            this.addChild(children[i]);
          }
        } else {
          var child = children[0];
          if (child.parent) {
            child.parent.removeChild(child);
          }
          child.parent = this;
          this.sortDirty = true;
          child.transform._parentID = -1;
          if (this._lastChild) {
            this._lastChild.nextChild = child;
            child.prevChild = this._lastChild;
            this._lastChild = child;
          } else {
            this._firstChild = this._lastChild = child;
          }
          ++this._childCount;
          this._boundsID++;
          this.onChildrenChange();
          this.emit("childAdded", child, this, this._childCount);
          child.emit("added", this);
        }
        return children[0];
      };
      LinkedListContainer2.prototype.addChildAt = function(child, index) {
        if (index < 0 || index > this._childCount) {
          throw new Error("addChildAt: The index " + index + " supplied is out of bounds " + this._childCount);
        }
        if (child.parent) {
          child.parent.removeChild(child);
        }
        child.parent = this;
        this.sortDirty = true;
        child.transform._parentID = -1;
        var c = child;
        if (!this._firstChild) {
          this._firstChild = this._lastChild = c;
        } else if (index === 0) {
          this._firstChild.prevChild = c;
          c.nextChild = this._firstChild;
          this._firstChild = c;
        } else if (index === this._childCount) {
          this._lastChild.nextChild = c;
          c.prevChild = this._lastChild;
          this._lastChild = c;
        } else {
          var i = 0;
          var target = this._firstChild;
          while (i < index) {
            target = target.nextChild;
            ++i;
          }
          target.prevChild.nextChild = c;
          c.prevChild = target.prevChild;
          c.nextChild = target;
          target.prevChild = c;
        }
        ++this._childCount;
        this._boundsID++;
        this.onChildrenChange(index);
        child.emit("added", this);
        this.emit("childAdded", child, this, index);
        return child;
      };
      LinkedListContainer2.prototype.addChildBelow = function(child, relative) {
        if (relative.parent !== this) {
          throw new Error("addChildBelow: The relative target must be a child of this parent");
        }
        if (child.parent) {
          child.parent.removeChild(child);
        }
        child.parent = this;
        this.sortDirty = true;
        child.transform._parentID = -1;
        relative.prevChild.nextChild = child;
        child.prevChild = relative.prevChild;
        child.nextChild = relative;
        relative.prevChild = child;
        if (this._firstChild === relative) {
          this._firstChild = child;
        }
        ++this._childCount;
        this._boundsID++;
        this.onChildrenChange();
        this.emit("childAdded", child, this, this._childCount);
        child.emit("added", this);
        return child;
      };
      LinkedListContainer2.prototype.addChildAbove = function(child, relative) {
        if (relative.parent !== this) {
          throw new Error("addChildBelow: The relative target must be a child of this parent");
        }
        if (child.parent) {
          child.parent.removeChild(child);
        }
        child.parent = this;
        this.sortDirty = true;
        child.transform._parentID = -1;
        relative.nextChild.prevChild = child;
        child.nextChild = relative.nextChild;
        child.prevChild = relative;
        relative.nextChild = child;
        if (this._lastChild === relative) {
          this._lastChild = child;
        }
        ++this._childCount;
        this._boundsID++;
        this.onChildrenChange();
        this.emit("childAdded", child, this, this._childCount);
        child.emit("added", this);
        return child;
      };
      LinkedListContainer2.prototype.swapChildren = function(child, child2) {
        if (child === child2 || child.parent !== this || child2.parent !== this) {
          return;
        }
        var _a = child, prevChild = _a.prevChild, nextChild = _a.nextChild;
        child.prevChild = child2.prevChild;
        child.nextChild = child2.nextChild;
        child2.prevChild = prevChild;
        child2.nextChild = nextChild;
        if (this._firstChild === child) {
          this._firstChild = child2;
        } else if (this._firstChild === child2) {
          this._firstChild = child;
        }
        if (this._lastChild === child) {
          this._lastChild = child2;
        } else if (this._lastChild === child2) {
          this._lastChild = child;
        }
        this.onChildrenChange();
      };
      LinkedListContainer2.prototype.getChildIndex = function(child) {
        var index = 0;
        var test = this._firstChild;
        while (test) {
          if (test === child) {
            break;
          }
          test = test.nextChild;
          ++index;
        }
        if (!test) {
          throw new Error("The supplied DisplayObject must be a child of the caller");
        }
        return index;
      };
      LinkedListContainer2.prototype.setChildIndex = function(child, index) {
        if (index < 0 || index >= this._childCount) {
          throw new Error("The index " + index + " supplied is out of bounds " + this._childCount);
        }
        if (child.parent !== this) {
          throw new Error("The supplied DisplayObject must be a child of the caller");
        }
        if (child.nextChild) {
          child.nextChild.prevChild = child.prevChild;
        }
        if (child.prevChild) {
          child.prevChild.nextChild = child.nextChild;
        }
        if (this._firstChild === child) {
          this._firstChild = child.nextChild;
        }
        if (this._lastChild === child) {
          this._lastChild = child.prevChild;
        }
        child.nextChild = null;
        child.prevChild = null;
        if (!this._firstChild) {
          this._firstChild = this._lastChild = child;
        } else if (index === 0) {
          this._firstChild.prevChild = child;
          child.nextChild = this._firstChild;
          this._firstChild = child;
        } else if (index === this._childCount) {
          this._lastChild.nextChild = child;
          child.prevChild = this._lastChild;
          this._lastChild = child;
        } else {
          var i = 0;
          var target = this._firstChild;
          while (i < index) {
            target = target.nextChild;
            ++i;
          }
          target.prevChild.nextChild = child;
          child.prevChild = target.prevChild;
          child.nextChild = target;
          target.prevChild = child;
        }
        this.onChildrenChange(index);
      };
      LinkedListContainer2.prototype.removeChild = function() {
        var children = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          children[_i] = arguments[_i];
        }
        if (children.length > 1) {
          for (var i = 0; i < children.length; i++) {
            this.removeChild(children[i]);
          }
        } else {
          var child = children[0];
          if (child.parent !== this)
            return null;
          child.parent = null;
          child.transform._parentID = -1;
          if (child.nextChild) {
            child.nextChild.prevChild = child.prevChild;
          }
          if (child.prevChild) {
            child.prevChild.nextChild = child.nextChild;
          }
          if (this._firstChild === child) {
            this._firstChild = child.nextChild;
          }
          if (this._lastChild === child) {
            this._lastChild = child.prevChild;
          }
          child.nextChild = null;
          child.prevChild = null;
          --this._childCount;
          this._boundsID++;
          this.onChildrenChange();
          child.emit("removed", this);
          this.emit("childRemoved", child, this);
        }
        return children[0];
      };
      LinkedListContainer2.prototype.getChildAt = function(index) {
        if (index < 0 || index >= this._childCount) {
          throw new Error("getChildAt: Index (" + index + ") does not exist.");
        }
        if (index === 0) {
          return this._firstChild;
        } else if (index === this._childCount) {
          return this._lastChild;
        }
        var i = 0;
        var target = this._firstChild;
        while (i < index) {
          target = target.nextChild;
          ++i;
        }
        return target;
      };
      LinkedListContainer2.prototype.removeChildAt = function(index) {
        var child = this.getChildAt(index);
        child.parent = null;
        child.transform._parentID = -1;
        if (child.nextChild) {
          child.nextChild.prevChild = child.prevChild;
        }
        if (child.prevChild) {
          child.prevChild.nextChild = child.nextChild;
        }
        if (this._firstChild === child) {
          this._firstChild = child.nextChild;
        }
        if (this._lastChild === child) {
          this._lastChild = child.prevChild;
        }
        child.nextChild = null;
        child.prevChild = null;
        --this._childCount;
        this._boundsID++;
        this.onChildrenChange(index);
        child.emit("removed", this);
        this.emit("childRemoved", child, this, index);
        return child;
      };
      LinkedListContainer2.prototype.removeChildren = function(beginIndex, endIndex) {
        if (beginIndex === void 0) {
          beginIndex = 0;
        }
        if (endIndex === void 0) {
          endIndex = this._childCount;
        }
        var begin = beginIndex;
        var end = endIndex;
        var range = end - begin;
        if (range > 0 && range <= end) {
          var removed = [];
          var child = this._firstChild;
          for (var i = 0; i <= end && child; ++i, child = child.nextChild) {
            if (i >= begin) {
              removed.push(child);
            }
          }
          var prevChild = removed[0].prevChild;
          var nextChild = removed[removed.length - 1].nextChild;
          if (!nextChild) {
            this._lastChild = prevChild;
          } else {
            nextChild.prevChild = prevChild;
          }
          if (!prevChild) {
            this._firstChild = nextChild;
          } else {
            prevChild.nextChild = nextChild;
          }
          for (var i = 0; i < removed.length; ++i) {
            removed[i].parent = null;
            if (removed[i].transform) {
              removed[i].transform._parentID = -1;
            }
            removed[i].nextChild = null;
            removed[i].prevChild = null;
          }
          this._boundsID++;
          this.onChildrenChange(beginIndex);
          for (var i = 0; i < removed.length; ++i) {
            removed[i].emit("removed", this);
            this.emit("childRemoved", removed[i], this, i);
          }
          return removed;
        } else if (range === 0 && this._childCount === 0) {
          return [];
        }
        throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
      };
      LinkedListContainer2.prototype.updateTransform = function() {
        this._boundsID++;
        this.transform.updateTransform(this.parent.transform);
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
        var child;
        var next;
        for (child = this._firstChild; child; child = next) {
          next = child.nextChild;
          if (child.visible) {
            child.updateTransform();
          }
        }
      };
      LinkedListContainer2.prototype.calculateBounds = function() {
        this._bounds.clear();
        this._calculateBounds();
        var child;
        var next;
        for (child = this._firstChild; child; child = next) {
          next = child.nextChild;
          if (!child.visible || !child.renderable) {
            continue;
          }
          child.calculateBounds();
          if (child._mask) {
            var maskObject = child._mask.maskObject || child._mask;
            maskObject.calculateBounds();
            this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
          } else if (child.filterArea) {
            this._bounds.addBoundsArea(child._bounds, child.filterArea);
          } else {
            this._bounds.addBounds(child._bounds);
          }
        }
        this._bounds.updateID = this._boundsID;
      };
      LinkedListContainer2.prototype.getLocalBounds = function(rect, skipChildrenUpdate) {
        if (skipChildrenUpdate === void 0) {
          skipChildrenUpdate = false;
        }
        var result = import_pixi.DisplayObject.prototype.getLocalBounds.call(this, rect);
        if (!skipChildrenUpdate) {
          var child = void 0;
          var next = void 0;
          for (child = this._firstChild; child; child = next) {
            next = child.nextChild;
            if (child.visible) {
              child.updateTransform();
            }
          }
        }
        return result;
      };
      LinkedListContainer2.prototype.render = function(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
          return;
        }
        if (this._mask || this.filters && this.filters.length) {
          this.renderAdvanced(renderer);
        } else {
          this._render(renderer);
          var child = void 0;
          var next = void 0;
          for (child = this._firstChild; child; child = next) {
            next = child.nextChild;
            child.render(renderer);
          }
        }
      };
      LinkedListContainer2.prototype.renderAdvanced = function(renderer) {
        renderer.batch.flush();
        var filters = this.filters;
        var mask = this._mask;
        if (filters) {
          if (!this._enabledFilters) {
            this._enabledFilters = [];
          }
          this._enabledFilters.length = 0;
          for (var i = 0; i < filters.length; i++) {
            if (filters[i].enabled) {
              this._enabledFilters.push(filters[i]);
            }
          }
          if (this._enabledFilters.length) {
            renderer.filter.push(this, this._enabledFilters);
          }
        }
        if (mask) {
          renderer.mask.push(this, this._mask);
        }
        this._render(renderer);
        var child;
        var next;
        for (child = this._firstChild; child; child = next) {
          next = child.nextChild;
          child.render(renderer);
        }
        renderer.batch.flush();
        if (mask) {
          renderer.mask.pop(this);
        }
        if (filters && this._enabledFilters && this._enabledFilters.length) {
          renderer.filter.pop();
        }
      };
      LinkedListContainer2.prototype.renderWebGL = function(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
          return;
        }
        if (this._mask || this.filters && this.filters.length) {
          this.renderAdvancedWebGL(renderer);
        } else {
          this._renderWebGL(renderer);
          var child = void 0;
          var next = void 0;
          for (child = this._firstChild; child; child = next) {
            next = child.nextChild;
            child.renderWebGL(renderer);
          }
        }
      };
      LinkedListContainer2.prototype.renderAdvancedWebGL = function(renderer) {
        renderer.flush();
        var filters = this._filters;
        var mask = this._mask;
        if (filters) {
          if (!this._enabledFilters) {
            this._enabledFilters = [];
          }
          this._enabledFilters.length = 0;
          for (var i = 0; i < filters.length; i++) {
            if (filters[i].enabled) {
              this._enabledFilters.push(filters[i]);
            }
          }
          if (this._enabledFilters.length) {
            renderer.filterManager.pushFilter(this, this._enabledFilters);
          }
        }
        if (mask) {
          renderer.maskManager.pushMask(this, this._mask);
        }
        this._renderWebGL(renderer);
        var child;
        var next;
        for (child = this._firstChild; child; child = next) {
          next = child.nextChild;
          child.renderWebGL(renderer);
        }
        renderer.flush();
        if (mask) {
          renderer.maskManager.popMask(this, this._mask);
        }
        if (filters && this._enabledFilters && this._enabledFilters.length) {
          renderer.filterManager.popFilter();
        }
      };
      LinkedListContainer2.prototype.renderCanvas = function(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
          return;
        }
        if (this._mask) {
          renderer.maskManager.pushMask(this._mask);
        }
        this._renderCanvas(renderer);
        var child;
        var next;
        for (child = this._firstChild; child; child = next) {
          next = child.nextChild;
          child.renderCanvas(renderer);
        }
        if (this._mask) {
          renderer.maskManager.popMask(renderer);
        }
      };
      return LinkedListContainer2;
    }(import_pixi.Container)
  );

  // scripts/particles-entry.js
  window.particles = pixi_particles_es_exports;
})();
/*! Bundled license information:

pixi-particles/lib/pixi-particles.es.js:
  (*!
   * pixi-particles - v4.3.1
   * Compiled Wed, 09 Jun 2021 13:12:54 UTC
   *
   * pixi-particles is licensed under the MIT License.
   * http://www.opensource.org/licenses/mit-license
   *)
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)
*/
