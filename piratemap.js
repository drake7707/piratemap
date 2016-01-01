var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
window.onload = function () { return Main.initialize(); };
var Helper;
(function (Helper) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        Point.prototype.floor = function () {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
        };
        Point.prototype.distanceTo = function (p2) {
            return Math.sqrt((p2.x - this.x) * (p2.x - this.x) + (p2.y - this.y) * (p2.y - this.y));
        };
        return Point;
    })();
    Helper.Point = Point;
    var RGB = (function () {
        function RGB(r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.r = Math.round(r);
            this.g = Math.round(g);
            this.b = Math.round(b);
        }
        RGB.prototype.toString = function () {
            return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        };
        RGB.getBlend = function (alpha, c1, c2) {
            var r, g, b;
            r = Math.floor(alpha * c1.r + (1 - alpha) * c2.r);
            g = Math.floor(alpha * c1.g + (1 - alpha) * c2.g);
            b = Math.floor(alpha * c1.b + (1 - alpha) * c2.b);
            return new RGB(r, g, b);
        };
        return RGB;
    })();
    Helper.RGB = RGB;
    var ASync = (function () {
        function ASync() {
            this.funcs = [];
        }
        ASync.do = function (data) {
            var f = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                f[_i - 1] = arguments[_i];
            }
            var a = new ASync();
            a.lastResult = data;
            for (var _a = 0; _a < f.length; _a++) {
                var fn = f[_a];
                a.funcs.push(fn);
            }
            a.run();
        };
        ASync.for = function (from, to, action, onDone, delayMs) {
            if (delayMs === void 0) { delayMs = 0; }
            var i = from;
            var func = function () {
                action(i);
                i++;
                if (i < to)
                    window.setTimeout(func, delayMs);
                else if (onDone)
                    onDone();
            };
            func();
        };
        ASync.awaitforof = function (elements, action, onDone, delayMs) {
            if (delayMs === void 0) { delayMs = 0; }
            var i = 0;
            var to = elements.length;
            var func = function () {
                var next = function () {
                    i++;
                    if (i < to)
                        window.setTimeout(func, delayMs);
                    else if (onDone)
                        onDone();
                };
                action(elements[i], next);
            };
            func();
        };
        ASync.awaitwhile = function (check, action, onDone, delayMs) {
            if (delayMs === void 0) { delayMs = 0; }
            var func = function () {
                var next = function () {
                    if (check())
                        window.setTimeout(func, delayMs);
                    else if (onDone)
                        onDone();
                };
                action(next);
            };
            func();
        };
        ASync.while = function (check, action, onDone, delayMs) {
            if (delayMs === void 0) { delayMs = 0; }
            var func = function () {
                action();
                if (check())
                    window.setTimeout(func, delayMs);
                else if (onDone)
                    onDone();
            };
            func();
        };
        ASync.sleep = function (ms, onDone) {
            var func = function () {
                if (onDone)
                    window.setTimeout(onDone, ms);
            };
            func();
        };
        ASync.prototype.run = function () {
            var _this = this;
            if (this.funcs.length > 0) {
                var f = this.funcs.shift();
                f(function (r) {
                    _this.lastResult = r;
                    _this.run();
                }, this.lastResult);
            }
        };
        return ASync;
    })();
    Helper.ASync = ASync;
    var Perf = (function () {
        function Perf() {
        }
        Perf.mark = function (name) {
            var t1 = performance.now();
            if (Perf.prevMark && name) {
                console.log("Time between marks:" + ((t1 - Perf.prevMark)) + "ms for " + name);
            }
            Perf.prevMark = t1;
        };
        return Perf;
    })();
    Helper.Perf = Perf;
    var Query = (function () {
        function Query() {
        }
        Query.getParameterByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };
        return Query;
    })();
    Helper.Query = Query;
})(Helper || (Helper = {}));
var Main;
(function (Main) {
    var colors = ['red', 'green', 'blue', 'yellow', 'cyan', 'pink'];
    var adornments = [document.getElementById("adornment1"), document.getElementById("adornment2"), document.getElementById("adornment3")];
    var landmarks;
    var terrains = [document.getElementById("terrain1"), document.getElementById("terrain2")];
    var w = 800;
    var h = 800;
    var Canvases = (function () {
        function Canvases() {
        }
        Canvases.setSize = function (w, h) {
            var canvases = [this.cBuffer, this.cBackground, this.cAdornments, this.cCA, this.cPath, this.cFinal, this.cOverlay];
            for (var _i = 0; _i < canvases.length; _i++) {
                var c = canvases[_i];
                c.width = w;
                c.height = h;
            }
        };
        Canvases.cBuffer = document.getElementById("cBuffer");
        Canvases.ctxBuffer = Canvases.cBuffer.getContext("2d");
        // layer for the background
        Canvases.cBackground = document.getElementById("cBackground");
        Canvases.ctxBackground = Canvases.cBackground.getContext("2d");
        // layer for adornments
        Canvases.cAdornments = document.getElementById("cAdornments");
        Canvases.ctxAdornments = Canvases.cAdornments.getContext("2d");
        // layer for the cellular automata
        Canvases.cCA = document.getElementById("cCA");
        Canvases.ctxCA = Canvases.cCA.getContext("2d");
        // layer for path
        Canvases.cPath = document.getElementById("cPath");
        Canvases.ctxPath = Canvases.cPath.getContext("2d");
        // final stitched image
        Canvases.cFinal = document.getElementById("cFinal");
        Canvases.ctxFinal = Canvases.cFinal.getContext("2d");
        // overlay
        Canvases.cOverlay = document.getElementById("cOverlay");
        Canvases.ctxOverlay = Canvases.cOverlay.getContext("2d");
        return Canvases;
    })();
    Main.Canvases = Canvases;
    // Generate landmarks to use
    function createLandmarks() {
        landmarks = [];
        var l = new LandmarkDefinition();
        l.idx = 0;
        l.image = document.getElementById("landmark1");
        l.prefix = "a";
        l.name = "deserted hut";
        l.description = "Well it was deserted when we buried the treasure at least. Who knows in what state it is now, be on your guard!";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 1;
        l.image = document.getElementById("landmark2");
        l.prefix = "a";
        l.name = "huge tree";
        l.description = "You know the kind I'm talking about, the ones you can create a three masted ship from.";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 2;
        l.image = document.getElementById("landmark3");
        l.prefix = "a";
        l.name = "pair of peculiar rocks";
        l.description = "Quite peculiar, in fact if bankers in your hometown were geologists you'd have found the treasure right here.";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 3;
        l.image = document.getElementById("landmark1");
        l.prefix = "a";
        l.name = "tribe of natives that like to eat pirate meat";
        l.description = "Run!";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 4;
        l.image = document.getElementById("landmark3");
        l.prefix = "a";
        l.name = "bunch of rocks piled up";
        l.description = "Yours truly went on rock hauling spree to make this, you better enjoy the view.";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 5;
        l.image = document.getElementById("landmark2");
        l.prefix = "a";
        l.name = "withered tree";
        l.description = "Now in hindsight using a withered tree might not have been the best of ideas for the longevity of this chart but hey, cap'n orders.";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 6;
        l.image = document.getElementById("landmark1");
        l.prefix = "a";
        l.name = "local tavern";
        l.description = "Now now, before you go boozing there's treasure to be found first!";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 7;
        l.image = document.getElementById("landmark3");
        l.prefix = "a";
        l.name = "scuplture that looks like random rock formation";
        l.description = "Anyone but the fine eye of the cap'n would say it was just a some rock formation.";
        landmarks.push(l);
        l = new LandmarkDefinition();
        l.idx = 8;
        l.image = document.getElementById("landmark2");
        l.prefix = "an";
        l.name = "oversized tree with a treehut in it";
        l.description = "Ah a land lover's crow nest, a poor imitation to a real one if you ask me.";
        landmarks.push(l);
    }
    // initializes the canvasses and starts the algorithm
    function initialize() {
        Canvases.setSize(w, h);
        createLandmarks();
        // fetch the seed if specified in the query string
        var seedparam = Helper.Query.getParameterByName("seed");
        var seed = undefined;
        if (parseInt(seedparam) != Number.NaN)
            seed = parseInt(seedparam);
        // run the algorithm
        var algorithm = new TreasureMapAlgorithm(seed);
        updateSeed(algorithm.seed + "");
        algorithm.run();
    }
    Main.initialize = initialize;
    function updateActionLabel(action) {
        document.getElementById("lblAction").innerHTML = action;
    }
    function updateSeed(seed) {
        document.getElementById("lblSeed").innerHTML = seed;
    }
    function updateSteps(steps) {
        document.getElementById("txtSteps").innerHTML = steps;
    }
    var TreasureMapAlgorithm = (function () {
        function TreasureMapAlgorithm(seed) {
            if (seed)
                this._seed = seed;
            else
                this._seed = new Date().getTime();
            this.rnd = new Sampling.Random(this._seed);
        }
        Object.defineProperty(TreasureMapAlgorithm.prototype, "seed", {
            get: function () { return this._seed; },
            enumerable: true,
            configurable: true
        });
        TreasureMapAlgorithm.prototype.run = function () {
            var _this = this;
            this.data = new TreasureMapAlgorithmData();
            Helper.ASync.do(null, 
            // create the background for the map
            function (next) {
                var bgRender = new Renderers.BackgroundRender(_this.rnd);
                bgRender.render(w, h, Canvases.cBackground, Canvases.ctxBackground, _this.onUpdate, next);
            }, 
            // create the islands with CA
            function (next) {
                var caRender = new Renderers.CARender(_this.rnd, 30);
                caRender.render(w, h, Canvases.cCA, Canvases.ctxCA, _this.onUpdate, next);
            }, 
            // store the result and determine the island data
            function (next, islandArray) {
                _this.data.islandData = new IslandData(islandArray);
                _this.asyncGetIslands(islandArray, _this.onUpdate, next);
            }, 
            // store the island search result after sorting by largest island first
            function (next, islands) {
                islands.sort(function (i1, i2) { return i2.size - i1.size; });
                _this.data.islands = islands;
                console.log(islands.length + " islands found");
                if (islands.length > 0) {
                    console.log("Largest island: " + islands[0].size);
                    next();
                }
            }, 
            // determine a random point on the largest island
            function (next) {
                updateActionLabel("Selecting random treasure point on largest island");
                var randomPointOnLargestIsland;
                var i = 0;
                do {
                    randomPointOnLargestIsland = _this.data.islands[0].points[Math.floor(_this.rnd.next() * _this.data.islands[0].points.length)];
                } while (i < 1000 && _this.data.islandData.nearWater(randomPointOnLargestIsland.x, randomPointOnLargestIsland.y, 40));
                next(randomPointOnLargestIsland);
            }, 
            // store the point and build the treasure map trajectory
            function (next, treasurePoint) {
                _this.data.treasurePoint = treasurePoint;
                Canvases.ctxOverlay.clearRect(0, 0, w, h);
                var trajectRender = new Renderers.TrajectRender(_this.rnd, _this.data.treasurePoint, _this.data);
                trajectRender.render(w, h, Canvases.cPath, Canvases.ctxPath, _this.onUpdate, next);
            }, 
            // generate landmarks along the path
            function (next, treasurePath) {
                _this.data.treasurePath = treasurePath;
                Canvases.ctxOverlay.clearRect(0, 0, w, h);
                var landmarkRender = new Renderers.LandmarkRender(_this.rnd, landmarks, _this.data);
                landmarkRender.render(w, h, Canvases.cPath, Canvases.ctxPath, _this.onUpdate, next);
            }, 
            // fill up the empty spaces on all islands with random terrain features
            function (next, landmarkPoints) {
                _this.data.landmarks = landmarkPoints;
                var terrainRender = new Renderers.TerrainRender(_this.rnd, terrains, _this.data);
                terrainRender.render(w, h, Canvases.cPath, Canvases.ctxPath, _this.onUpdate, next);
            }, 
            // generate the textual steps to find the treasure
            function (next) {
                var stepsRender = new Renderers.StepsRender(_this.rnd, landmarks, _this.data);
                stepsRender.render(w, h, Canvases.cPath, Canvases.ctxPath, _this.onUpdate, next);
            }, 
            // add adornments in the sea
            function (next, steps) {
                _this.data.steps = steps;
                updateSteps(_this.data.steps.join("\n\n"));
                var adornmentRender = new Renderers.AdornmentRender(_this.rnd, adornments, _this.data);
                adornmentRender.render(w, h, Canvases.cAdornments, Canvases.ctxAdornments, _this.onUpdate, next);
            }, 
            // finish by hiding the overlay
            function (next) {
                updateActionLabel("Finished");
                Canvases.cOverlay.setAttribute("class", "hidden");
            });
        };
        TreasureMapAlgorithm.prototype.asyncGetIslands = function (islandArray, onUpdate, onDone) {
            // a simple iterative depth first algorithm to find all the different islands
            // keep track of which points we visited
            var visited;
            visited = new Array(w);
            for (var i = 0; i < w; i++) {
                visited[i] = new Array(h);
                for (var j = 0; j < h; j++) {
                    visited[i][j] = false;
                }
            }
            var curColorIdx = 0;
            var result = [];
            // iterate all points
            Helper.ASync.for(0, w, function (i) {
                for (var j = 0; j < h; j++) {
                    // as long as it's on an island and not visited yet
                    // that means we encountered a new island
                    if (islandArray[i][j] && !visited[i][j]) {
                        updateActionLabel("Searching for islands - " + result.length + " islands found so far");
                        var cur = new IslandSearchResult();
                        var curColor = colors[curColorIdx];
                        Canvases.ctxOverlay.fillStyle = curColor;
                        // keep pushing points of the island on the same stack
                        // by adding each point's neighbours
                        var stack = [];
                        stack.push(new Helper.Point(i, j));
                        while (stack.length > 0) {
                            var pt = stack.pop();
                            if (islandArray[pt.x][pt.y] && !visited[pt.x][pt.y]) {
                                if (islandArray[i, j]) {
                                    cur.points.push(pt);
                                    //highlight the islands
                                    Canvases.ctxOverlay.fillRect(pt.x, pt.y, 1, 1);
                                    cur.size++;
                                }
                                if (pt.x - 1 >= 0)
                                    stack.push(new Helper.Point(pt.x - 1, pt.y));
                                if (pt.x + 1 < w)
                                    stack.push(new Helper.Point(pt.x + 1, pt.y));
                                if (pt.y - 1 >= 0)
                                    stack.push(new Helper.Point(pt.x, pt.y - 1));
                                if (pt.y + 1 < h)
                                    stack.push(new Helper.Point(pt.x, pt.y + 1));
                                visited[pt.x][pt.y] = true;
                            }
                        }
                        // if the stack runs out then we're finished with this island
                        result.push(cur);
                        curColorIdx = ++curColorIdx % colors.length;
                    }
                }
            }, function () { return onDone(result); });
        };
        TreasureMapAlgorithm.prototype.onUpdate = function () {
            Canvases.ctxBuffer.drawImage(Canvases.cBackground, 0, 0, w, h);
            var caImgData = Canvases.ctxCA.getImageData(0, 0, w, h);
            var caPixels = caImgData.data;
            var adornmentsImgData = Canvases.ctxAdornments.getImageData(0, 0, w, h);
            var adornmentsPixels = adornmentsImgData.data;
            var imgData = Canvases.ctxBuffer.getImageData(0, 0, w, h);
            var pBuffer = imgData.data;
            for (var i = 0; i < pBuffer.length; i += 4) {
                if (caPixels[i] == 255) {
                    var total = 255 - pBuffer[i] + 255 - pBuffer[i + 1] + 255 - pBuffer[i + 2];
                    var part = Math.floor(total / 3);
                    pBuffer[i] = part; // red
                    pBuffer[i + 1] = part; // green
                    pBuffer[i + 2] = part; // blue
                }
                else if (adornmentsPixels[i + 3] != 0) {
                    var alpha = adornmentsPixels[i + 3] / 255;
                    var total = adornmentsPixels[i] - pBuffer[i] + adornmentsPixels[i + 1] - pBuffer[i + 1] + adornmentsPixels[i + 2] - pBuffer[i + 2];
                    var part = Math.floor(total / 3);
                    pBuffer[i] = Math.floor(pBuffer[i] * (1 - alpha) + part * alpha); // red
                    pBuffer[i + 1] = Math.floor(pBuffer[i + 1] * (1 - alpha) + part * alpha); // green
                    pBuffer[i + 2] = Math.floor(pBuffer[i + 2] * (1 - alpha) + part * alpha); // blue
                }
            }
            Canvases.ctxBuffer.putImageData(imgData, 0, 0);
            Canvases.ctxFinal.drawImage(Canvases.cBuffer, 0, 0);
            Canvases.ctxFinal.drawImage(Canvases.cPath, 0, 0);
        };
        return TreasureMapAlgorithm;
    })();
    Main.TreasureMapAlgorithm = TreasureMapAlgorithm;
    var LandmarkDefinition = (function () {
        function LandmarkDefinition() {
        }
        LandmarkDefinition.prototype.getDirectionText = function (left, direction, visitedLandmarkCount, rnd) {
            // Try to create some randomness to the sentences
            var verbs = "Move|Head|Walk|Travel|Journey".split('|');
            var verb = verbs[Math.floor(rnd.nextBetween(0, verbs.length))];
            var untils = "until you see|until you encounter|until you gaze upon|until you come across".split("|");
            var until = untils[Math.floor(rnd.nextBetween(0, untils.length))];
            var anothers = "yet another|another".split("|");
            var yetanother = visitedLandmarkCount[this.idx] > 0 ? " " + anothers[Math.floor(rnd.nextBetween(0, anothers.length))] + " " : " " + this.prefix + " ";
            var side = left ? "left" : "right";
            var text = verb + " " + direction + " " + until + yetanother + this.name + ".";
            if (visitedLandmarkCount[this.idx] == 0 && this.description)
                text += " " + this.description;
            return text;
        };
        return LandmarkDefinition;
    })();
    var LandmarkPoint = (function (_super) {
        __extends(LandmarkPoint, _super);
        function LandmarkPoint(x, y) {
            _super.call(this, x, y);
        }
        return LandmarkPoint;
    })(Helper.Point);
    var IslandData = (function () {
        function IslandData(mask) {
            this.mask = mask;
        }
        IslandData.prototype.isIsland = function (x, y) {
            x = Math.floor(x);
            y = Math.floor(y);
            return this.mask[x][y];
        };
        IslandData.prototype.nearIsland = function (x, y, radius) {
            for (var i = x - radius; i < x + radius; i++) {
                for (var j = y - radius; j < y + radius; j++) {
                    if (i >= 0 && j >= 0 && i < w && j < h) {
                        if (this.isIsland(i, j))
                            return true;
                    }
                    else
                        return true;
                }
            }
            return false;
        };
        IslandData.prototype.nearWater = function (x, y, radius) {
            for (var i = x - radius; i < x + radius; i++) {
                for (var j = y - radius; j < y + radius; j++) {
                    if (i >= 0 && j >= 0 && i < w && j < h) {
                        if (!this.isIsland(i, j))
                            return true;
                    }
                    else
                        return true;
                }
            }
            return false;
        };
        return IslandData;
    })();
    var TreasureMapAlgorithmData = (function () {
        function TreasureMapAlgorithmData() {
        }
        return TreasureMapAlgorithmData;
    })();
    var IslandSearchResult = (function () {
        function IslandSearchResult() {
            this.size = 0;
            this.points = [];
        }
        return IslandSearchResult;
    })();
    var Renderers;
    (function (Renderers) {
        var Render = (function () {
            function Render(rnd) {
                this.rnd = rnd;
            }
            return Render;
        })();
        Renderers.Render = Render;
        var CARender = (function (_super) {
            __extends(CARender, _super);
            function CARender(rnd, initialPadding) {
                _super.call(this, rnd);
                this.initialPadding = initialPadding;
                var caRules = new CellularAutomata.CALifeRules("23/3");
                // run a CA on half the width and height of the map
                // any larger would make it lag too much
                this.ca = new CellularAutomata.CA(w / 2, h / 2, caRules, this.rnd);
            }
            CARender.prototype.getIslandArray = function () {
                var cells = this.ca.getBoard();
                var arr = new Array(w);
                for (var i = 0; i < w; i++) {
                    arr[i] = new Array(h);
                    for (var j = 0; j < h; j++) {
                        if (cells[Math.floor(i / 2)][Math.floor(j / 2)].definition == 1)
                            arr[i][j] = true;
                    }
                }
                return arr;
            };
            CARender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var _this = this;
                this.ca.randomize(this.initialPadding);
                this.ca.draw(c, ctx, false, true);
                // tiny function so I can put each of the steps in a single line
                var advanceCA = function () {
                    _this.ca.update();
                    _this.ca.draw(c, ctx, false, false);
                    onUpdate();
                };
                Helper.ASync.do(null, function (next) {
                    // amoeba 
                    updateActionLabel("Running CA 150x 5678/35678 (Amoeba)");
                    _this.ca.caRules.applyRules("5678/35678");
                    Helper.ASync.for(0, 150, function (i) { return advanceCA(); }, next);
                }, function (next) {
                    // smooth edges
                    updateActionLabel("Running CA 2x 123/01234 (Smooth edges)");
                    _this.ca.caRules.applyRules("123/01234");
                    Helper.ASync.for(0, 2, function (i) { return advanceCA(); }, next);
                }, function (next) {
                    // roughen edges again
                    updateActionLabel("Running CA 80x 5678/3 (Roughen edges)");
                    _this.ca.caRules.applyRules("5678/3");
                    Helper.ASync.for(0, 80, function (i) { return advanceCA(); }, next);
                }, function (next) {
                    // remove individual cells and other "noise"
                    updateActionLabel("Running CA 20x 3456789/ (Remove invidual cells and other noise)");
                    _this.ca.caRules.applyRules("3456789/");
                    Helper.ASync.for(0, 20, function (i) { return advanceCA(); }, next);
                }, function (next) {
                    // pass along an island array for the next handler in the chain
                    onDone(_this.getIslandArray());
                });
            };
            return CARender;
        })(Render);
        Renderers.CARender = CARender;
        var BackgroundRender = (function (_super) {
            __extends(BackgroundRender, _super);
            function BackgroundRender(rnd) {
                _super.call(this, rnd);
                this.percentageTorn = 0.02;
            }
            BackgroundRender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var _this = this;
                // c1 is the base color, c2 and c3 are darker and lighter colors for the noise
                var c1 = new Helper.RGB(231, 217, 191);
                var c2 = new Helper.RGB(150, 120, 100);
                var c3 = new Helper.RGB(193, 167, 127);
                var percentageChancheLighterNoise = 0.5;
                var percentageChancheDarkerNoise = 0.5;
                // reduce the opacity of the DS algorithm noise by multiplying with these values
                var lighternoiseEffectiveness = 0.7;
                var darkernoiseEffectiveness = 0.4;
                var lighterNoiseRoughness = 40;
                var darkerNoiseRoughness = 40;
                // fill the background with the base color
                ctx.fillStyle = c1.toString();
                ctx.fillRect(0, 0, w, h);
                updateActionLabel("Generating background");
                var dsForLighterNoise;
                var dsForDarkerNoise;
                var self = this;
                Helper.ASync.do(null, function (next) {
                    updateActionLabel("Generating diamond square noise 1");
                    dsForLighterNoise = new Noise.DiamondSquare(w, _this.rnd, lighterNoiseRoughness);
                    next();
                }, function (next) {
                    updateActionLabel("Generating diamond square noise 2");
                    dsForDarkerNoise = new Noise.DiamondSquare(w, _this.rnd, darkerNoiseRoughness);
                    next();
                }, function (next) {
                    updateActionLabel("Rendering background");
                    var cur = Math.floor(_this.rnd.next() * 255);
                    var idx = 0;
                    var imgData = ctx.getImageData(0, 0, w, h);
                    Helper.ASync.for(0, h, function (j) {
                        for (var i = 0; i < w; i++) {
                            var dsLight = dsForLighterNoise.getValue(i, j);
                            var dsDark = dsForDarkerNoise.getValue(i, j);
                            // randomly put noise 
                            if (_this.rnd.next() < percentageChancheLighterNoise) {
                                var c_1 = Helper.RGB.getBlend(1 - (dsLight * _this.rnd.next() * lighternoiseEffectiveness), c1, c3);
                                imgData.data[idx++] = c_1.r;
                                imgData.data[idx++] = c_1.g;
                                imgData.data[idx++] = c_1.b;
                                idx++;
                            }
                            else if (_this.rnd.next() < percentageChancheDarkerNoise) {
                                var c_2 = Helper.RGB.getBlend(1 - (dsDark * _this.rnd.next() * darkernoiseEffectiveness), c1, c2);
                                imgData.data[idx++] = c_2.r;
                                imgData.data[idx++] = c_2.g;
                                imgData.data[idx++] = c_2.b;
                                idx++;
                            }
                            else {
                                idx += 4;
                            }
                        }
                        // update every 10% of the image
                        if (j % Math.floor(h / 10) == 0) {
                            ctx.putImageData(imgData, 0, 0);
                            onUpdate();
                        }
                    }, function () {
                        ctx.putImageData(imgData, 0, 0);
                        onUpdate();
                        next();
                    });
                }, function (next) {
                    ctx.fillStyle = "white";
                    var minBaseWidth = 5;
                    var maxBaseWidth = 20;
                    var minTearHeight = 5;
                    var maxTearHeight = 20;
                    // tear top
                    for (var i = 0; i < _this.percentageTorn * w; i++) {
                        var x = Math.floor(_this.rnd.next() * w);
                        var tearBaseWidth = _this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                        var tearHeight = _this.rnd.nextBetween(minTearHeight, maxTearHeight);
                        ctx.beginPath();
                        ctx.moveTo(x - tearBaseWidth / 2, 0);
                        ctx.lineTo(x, tearHeight);
                        ctx.lineTo(x + tearBaseWidth / 2, 0);
                        ctx.fill();
                    }
                    // tear bottom
                    for (var i = 0; i < _this.percentageTorn * w; i++) {
                        var x = Math.floor(_this.rnd.next() * w);
                        var tearBaseWidth = _this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                        var tearHeight = _this.rnd.nextBetween(minTearHeight, maxTearHeight);
                        ctx.beginPath();
                        ctx.moveTo(x - tearBaseWidth / 2, h);
                        ctx.lineTo(x, h - tearHeight);
                        ctx.lineTo(x + tearBaseWidth / 2, h);
                        ctx.fill();
                    }
                    // tear left
                    for (var i = 0; i < _this.percentageTorn * h; i++) {
                        var y = Math.floor(_this.rnd.next() * w);
                        var tearBaseWidth = _this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                        var tearHeight = _this.rnd.nextBetween(minTearHeight, maxTearHeight);
                        ctx.beginPath();
                        ctx.moveTo(0, y - tearBaseWidth / 2);
                        ctx.lineTo(tearHeight, y);
                        ctx.lineTo(0, y + tearBaseWidth / 2);
                        ctx.fill();
                    }
                    // tear right
                    for (var i = 0; i < _this.percentageTorn * h; i++) {
                        var y = Math.floor(_this.rnd.next() * w);
                        var tearBaseWidth = _this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                        var tearHeight = _this.rnd.nextBetween(minTearHeight, maxTearHeight);
                        ctx.beginPath();
                        ctx.moveTo(w, y - tearBaseWidth / 2);
                        ctx.lineTo(w - tearHeight, y);
                        ctx.lineTo(w, y + tearBaseWidth / 2);
                        ctx.fill();
                    }
                    next();
                }, function (next) {
                    onUpdate();
                    onDone();
                });
            };
            return BackgroundRender;
        })(Render);
        Renderers.BackgroundRender = BackgroundRender;
        var TrajectRender = (function (_super) {
            __extends(TrajectRender, _super);
            function TrajectRender(rnd, startingPoint, result) {
                _super.call(this, rnd);
                this.startingPoint = startingPoint;
                this.result = result;
            }
            TrajectRender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var _this = this;
                var pd = new Sampling.PoissonDisc(w, h, 10, 1000, this.rnd, function (x, y) { return _this.result.islandData.isIsland(x, y) && !_this.result.islandData.nearWater(x, y, TrajectRender.MIN_RADIUS_FROM_WATER); });
                pd.drawLinkColor = "white";
                pd.drawLinks = true;
                pd.addInitialSample(this.startingPoint.x, this.startingPoint.y);
                var traject;
                Helper.ASync.do(null, function (next) {
                    updateActionLabel("Searching for deepest poisson disc sampling path");
                    Helper.ASync.while(function () { return !pd.isDone; }, function () { return pd.step(); }, next);
                }, function (next) {
                    updateActionLabel("Following traject to treasure point");
                    ctx.beginPath();
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 10]);
                    var s = pd.getDeepestSample();
                    var prevSample = s.previousSample;
                    var oldx = s.x;
                    var oldy = s.y;
                    ctx.strokeStyle = "#ba4d04";
                    ctx.moveTo(oldx, oldy);
                    // draw on the overlay as well as on the canvas given because
                    // the overlay keeps starting new paths & stroking on each 
                    // point, which gives a much more jaggy look than it's supposed to
                    // but it's fine to indicate the progress
                    // this is usually done almost instantly so there's a DELAY given
                    // in the while loop
                    Canvases.ctxOverlay.strokeStyle = "#ba4d04";
                    Canvases.ctxOverlay.lineWidth = 5;
                    Canvases.ctxOverlay.moveTo(oldx, oldy);
                    traject = [];
                    traject.push(s);
                    ctx.beginPath();
                    Helper.ASync.while(function () { return s != null && prevSample != null; }, function () {
                        traject.push(prevSample);
                        var xc = (s.x + prevSample.x) / 2;
                        var yc = (s.y + prevSample.y) / 2;
                        ctx.quadraticCurveTo(s.x, s.y, xc, yc);
                        Canvases.ctxOverlay.beginPath();
                        Canvases.ctxOverlay.quadraticCurveTo(s.x, s.y, xc, yc);
                        Canvases.ctxOverlay.stroke();
                        s = prevSample;
                        prevSample = prevSample.previousSample;
                        // if final sample end with a stroke from the half point to the end
                        if (prevSample == null) {
                            ctx.quadraticCurveTo(xc, yc, s.x, s.y);
                            ctx.stroke();
                            onUpdate();
                        }
                    }, next, TrajectRender.DELAY);
                }, function (next) {
                    updateActionLabel("Drawing big X");
                    var treasurePoint = traject[traject.length - 1];
                    ctx.stroke();
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.font = "50px Comic Sans MS";
                    // create a big X with 2 reddish inner, then white and black outer
                    // borders
                    ctx.beginPath();
                    ctx.setLineDash([]);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 10;
                    ctx.strokeText("X", treasurePoint.x, treasurePoint.y);
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 5;
                    ctx.strokeText("X", treasurePoint.x, treasurePoint.y);
                    ctx.fillStyle = "#ba4d04";
                    ctx.lineWidth = 15;
                    ctx.fillText("X", treasurePoint.x, treasurePoint.y);
                    next();
                }, function (next) {
                    onUpdate();
                    // pass along the traject samples
                    onDone(traject);
                });
            };
            TrajectRender.DELAY = 25;
            TrajectRender.MIN_RADIUS_FROM_WATER = 10;
            return TrajectRender;
        })(Render);
        Renderers.TrajectRender = TrajectRender;
        var AdornmentRender = (function (_super) {
            __extends(AdornmentRender, _super);
            function AdornmentRender(rnd, adornments, result) {
                _super.call(this, rnd);
                this.adornments = adornments;
                this.result = result;
                this.curAdornment = 0;
                this.minAdornmentRadius = 40;
                this.limitAttemptsInitialPoint = 1000;
            }
            AdornmentRender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var _this = this;
                var pd = new Sampling.PoissonDisc(w, h, Math.floor(w / 4), 1000, this.rnd, function (x, y) { return !_this.result.islandData.nearIsland(x, y, _this.minAdornmentRadius); });
                pd.drawLinks = false;
                var initx, inity;
                var initSampleFound = false;
                var hardLimit = 0;
                while (!initSampleFound && hardLimit++ < this.limitAttemptsInitialPoint) {
                    initx = Math.floor(this.rnd.next() * w);
                    inity = Math.floor(this.rnd.next() * h);
                    if (!this.result.islandData.nearIsland(initx, inity, this.minAdornmentRadius))
                        initSampleFound = true;
                }
                if (!initSampleFound) {
                    onDone();
                    return;
                }
                pd.addInitialSample(initx, inity);
                Helper.ASync.do(null, function (next) {
                    updateActionLabel("Sampling adornment points outside islands with poisson disc sampling");
                    Helper.ASync.while(function () { return !pd.isDone; }, function () { return pd.step(); }, next, 25);
                }, function (next) {
                    updateActionLabel("Drawing adornments on the sampling points");
                    // draw adornments in sequence on all the points found
                    for (var _i = 0, _a = pd.samples; _i < _a.length; _i++) {
                        var s = _a[_i];
                        ctx.drawImage(_this.adornments[_this.curAdornment], s.x - _this.minAdornmentRadius, s.y - _this.minAdornmentRadius, _this.minAdornmentRadius * 2, _this.minAdornmentRadius * 2);
                        onUpdate();
                        _this.curAdornment = ++_this.curAdornment % _this.adornments.length;
                    }
                    next();
                }, function (next) {
                    onUpdate();
                    onDone();
                });
            };
            return AdornmentRender;
        })(Render);
        Renderers.AdornmentRender = AdornmentRender;
        var LandmarkRender = (function (_super) {
            __extends(LandmarkRender, _super);
            function LandmarkRender(rnd, landmarks, result) {
                _super.call(this, rnd);
                this.landmarks = landmarks;
                this.result = result;
                this.landMarkRadius = 16;
                this.maxLandmarksAlongTraject = 10;
                this.maxStepsAway = 2;
                this.minDistanceProximity = 15; // pixels;
                this.minDistanceFromShore = 10;
                this.LOOP_DELAY = 10;
            }
            LandmarkRender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var _this = this;
                Canvases.ctxOverlay.fillStyle = "black";
                Canvases.ctxOverlay.strokeStyle = "white";
                Canvases.ctxOverlay.lineWidth = 3;
                var trajectPoints = [];
                for (var _i = 0, _a = this.result.treasurePath; _i < _a.length; _i++) {
                    var s = _a[_i];
                    trajectPoints.push(new Helper.Point(s.x, s.y));
                }
                // determine the total length of the traject 
                // and divide it by the max number of landmarks there should be
                // that'll be the average distance that needs to be between the 
                // already placed landmarks
                var totalTrajectLength = this.getTotalLengthOfTraject();
                var minDistanceFromOtherLandmarks = Math.floor(totalTrajectLength / this.maxLandmarksAlongTraject);
                updateActionLabel("Calculating positions to place landmarks along the path");
                var possibleLandmarkPoints = [];
                Helper.ASync.do(null, function (next) {
                    Helper.ASync.for(0, _this.result.treasurePath.length - 1, function (i) {
                        var p1 = _this.result.treasurePath[i];
                        var p2 = _this.result.treasurePath[i + 1];
                        var v = new Helper.Point(p2.x - p1.x, p2.y - p1.y);
                        // [ cos &   -sin &  ] [x]
                        // [ sin &   cos &  ] [y]
                        var angle = Math.PI / 4;
                        // create 90° vector
                        var vrot90 = new Helper.Point(Math.cos(angle) * v.x - Math.sin(angle) * v.y, Math.sin(angle) * v.x + Math.cos(angle) * v.y);
                        //choose random nr of steps (length between sampling points of the traject = 1 step) 
                        var stepsAway = _this.rnd.nextBetween(1.5, _this.maxStepsAway);
                        // choose a point on the right side of the traject
                        var possPoint1 = new LandmarkPoint(p1.x + vrot90.x * stepsAway, p1.y + vrot90.y * stepsAway);
                        possPoint1.trajectIndex = i;
                        possPoint1.left = false;
                        possPoint1.landmarkDefinitionIdx = Math.floor(_this.rnd.next() * _this.landmarks.length);
                        possPoint1.floor();
                        // and a point on the left side
                        var possPoint2 = new LandmarkPoint(p1.x - vrot90.x * stepsAway, p1.y - vrot90.y * stepsAway);
                        possPoint2.trajectIndex = i;
                        possPoint2.left = true;
                        possPoint2.landmarkDefinitionIdx = Math.floor(_this.rnd.next() * _this.landmarks.length);
                        possPoint2.floor();
                        // both points have to adhere to some criteria:
                        // - it needs to be on an island and not near a shore so the entire image falls inside the island
                        // - it needs to be both har enough from the trajectory (so it doesn't overlap) and from already placed landmark points
                        if (_this.result.islandData.isIsland(possPoint1.x, possPoint1.y) &&
                            !_this.result.islandData.nearWater(possPoint1.x, possPoint1.y, _this.minDistanceFromShore) &&
                            _this.isFarEnough(possPoint1, trajectPoints, _this.minDistanceProximity) &&
                            _this.isFarEnough(possPoint1, possibleLandmarkPoints, minDistanceFromOtherLandmarks)) {
                            // draw a dot on the overlay
                            Canvases.ctxOverlay.beginPath();
                            Canvases.ctxOverlay.arc(possPoint1.x, possPoint1.y, 5, 0, 2 * Math.PI, false);
                            Canvases.ctxOverlay.fill();
                            Canvases.ctxOverlay.stroke();
                            possibleLandmarkPoints.push(possPoint1);
                        }
                        if (_this.result.islandData.isIsland(possPoint2.x, possPoint2.y) &&
                            !_this.result.islandData.nearWater(possPoint2.x, possPoint2.y, _this.minDistanceFromShore) &&
                            _this.isFarEnough(possPoint2, trajectPoints, _this.minDistanceProximity) &&
                            _this.isFarEnough(possPoint2, possibleLandmarkPoints, minDistanceFromOtherLandmarks)) {
                            // draw a dot on the overlay
                            Canvases.ctxOverlay.beginPath();
                            Canvases.ctxOverlay.arc(possPoint2.x, possPoint2.y, 5, 0, 2 * Math.PI, false);
                            Canvases.ctxOverlay.fill();
                            Canvases.ctxOverlay.stroke();
                            possibleLandmarkPoints.push(possPoint2);
                        }
                    }, next, _this.LOOP_DELAY);
                }, function (next) {
                    // now draw the landmarks 
                    for (var _i = 0; _i < possibleLandmarkPoints.length; _i++) {
                        var pt = possibleLandmarkPoints[_i];
                        var landmarkDefinition = _this.landmarks[pt.landmarkDefinitionIdx];
                        ctx.drawImage(landmarkDefinition.image, pt.x - _this.landMarkRadius, pt.y - _this.landMarkRadius, _this.landMarkRadius * 2, _this.landMarkRadius * 2);
                        onUpdate();
                    }
                    next();
                }, function (next) {
                    onUpdate();
                    onDone(possibleLandmarkPoints);
                });
            };
            LandmarkRender.prototype.getTotalLengthOfTraject = function () {
                var length = 0;
                for (var i = 0; i < this.result.treasurePath.length - 1; i++) {
                    var p = this.result.treasurePath[i + 1];
                    length += this.result.treasurePath[i].distanceTo(p.x, p.y);
                }
                return length;
            };
            LandmarkRender.prototype.isFarEnough = function (pt, points, minDistance) {
                for (var _i = 0; _i < points.length; _i++) {
                    var p = points[_i];
                    if (pt.distanceTo(p) < minDistance)
                        return false;
                }
                return true;
            };
            return LandmarkRender;
        })(Render);
        Renderers.LandmarkRender = LandmarkRender;
        var StepsRender = (function (_super) {
            __extends(StepsRender, _super);
            function StepsRender(rnd, landmarkDefinitions, result) {
                _super.call(this, rnd);
                this.landmarkDefinitions = landmarkDefinitions;
                this.result = result;
            }
            StepsRender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var steps = [];
                // start at the first point of the traject
                var curTrajectIdx = 0;
                // intialize a nr of times visited array per landmark so this can be checked in the creation of the description
                var visitedLandMarkCount = new Array(this.landmarkDefinitions.length);
                for (var i = 0; i < this.landmarkDefinitions.length; i++) {
                    visitedLandMarkCount[i] = 0;
                }
                // go over all landmarks (except the last one) and calculate the vector between 2 landmarks
                // that vector will be the direction vector
                for (var i = 0; i < this.result.landmarks.length - 1; i++) {
                    var curLandMark = this.result.landmarks[i];
                    var nextTrajectIdx = curLandMark.trajectIndex;
                    // direction between 2 landmark points
                    var direction = this.getDirection(curTrajectIdx, nextTrajectIdx - curTrajectIdx);
                    curTrajectIdx = nextTrajectIdx;
                    // now push the landmark random generated text to the steps
                    var landmarkDefinition = this.landmarkDefinitions[curLandMark.landmarkDefinitionIdx];
                    steps.push(landmarkDefinition.getDirectionText(curLandMark.left, direction, visitedLandMarkCount, this.rnd));
                    visitedLandMarkCount[curLandMark.landmarkDefinitionIdx]++;
                }
                steps.push("You're almost there!");
                // add the last landmark, this will create a vector to the actual treasure
                // point
                var lastLandmark = this.result.landmarks[this.result.landmarks.length - 1];
                var lastLandmarkDefinition = this.landmarkDefinitions[lastLandmark.landmarkDefinitionIdx];
                var lastDirection = this.getDirection(curTrajectIdx, this.result.treasurePath.length - curTrajectIdx);
                steps.push(lastLandmarkDefinition.getDirectionText(lastLandmark.left, lastDirection, visitedLandMarkCount, this.rnd));
                // now a landmark can be a bit away so finalize with taking steps
                // to the actual point
                var dist = Math.floor(this.result.treasurePath[lastLandmark.trajectIndex].distanceTo(this.result.treasurePoint.x, this.result.treasurePoint.y));
                var toTreasureVx = this.result.treasurePoint.x - this.result.treasurePath[lastLandmark.trajectIndex].x;
                var toTreasureVy = this.result.treasurePoint.y - this.result.treasurePath[lastLandmark.trajectIndex].y;
                var toTreasureDir = this.getDirectionFromVector(toTreasureVx, toTreasureVy);
                steps.push("Now take " + dist + " steps " + toTreasureDir + " from there and start digging!");
                onDone(steps);
            };
            StepsRender.prototype.getDirection = function (curIdx, maxlookahead) {
                // average all vectors along the traject between the curIdx and the curIdx + maxlookahead
                // points, that'll give us the average direction
                var path = this.result.treasurePath;
                var count = 0;
                var sumvx = 0;
                var sumvy = 0;
                for (var i = 1; i <= maxlookahead && curIdx + i < path.length; i++) {
                    var prevPoint = path[curIdx + i - 1];
                    var nextPoint = path[curIdx + i];
                    var vx = nextPoint.x - prevPoint.x;
                    var vy = nextPoint.y - prevPoint.y;
                    sumvx += vx;
                    sumvy += vy;
                    count++;
                }
                var avgx = sumvx / count;
                var avgy = sumvy / count;
                return this.getDirectionFromVector(avgx, avgy);
            };
            StepsRender.prototype.getDirectionFromVector = function (vx, vy) {
                var pi = Math.PI;
                var angle = Math.atan2(vy, vx);
                if (angle < 0)
                    angle += 2 * Math.PI;
                if (angle < 1 / 8 * pi || angle > 2 * pi - 1 / 8 * pi)
                    return "east";
                else if (angle < 3 / 8 * pi)
                    return "south east";
                else if (angle < 5 / 8 * pi)
                    return "south";
                else if (angle < 7 / 8 * pi)
                    return "south west";
                else if (angle < 9 / 8 * pi)
                    return "west";
                else if (angle < 11 / 8 * pi)
                    return "north west";
                else if (angle < 13 / 8 * pi)
                    return "north";
                else
                    return "north east";
            };
            return StepsRender;
        })(Render);
        Renderers.StepsRender = StepsRender;
        var TerrainRender = (function (_super) {
            __extends(TerrainRender, _super);
            function TerrainRender(rnd, terrains, result) {
                _super.call(this, rnd);
                this.terrains = terrains;
                this.result = result;
            }
            TerrainRender.prototype.render = function (w, h, c, ctx, onUpdate, onDone) {
                var _this = this;
                // list all points that the terrain should stay away from
                var proximityPoints = [];
                for (var _i = 0, _a = this.result.treasurePath; _i < _a.length; _i++) {
                    var s = _a[_i];
                    proximityPoints.push(new Helper.Point(s.x, s.y));
                }
                for (var _b = 0, _c = this.result.landmarks; _b < _c.length; _b++) {
                    var pt = _c[_b];
                    proximityPoints.push(new Helper.Point(pt.x, pt.y));
                }
                var radiusFromShore = 20;
                var minDistanceFromExistingPoints = 50;
                var distanceBetweenPoints = 20;
                var nrOfPoints = 20;
                var terrainRadius = 16;
                var maxgroups = 5;
                var maxAttemptsToFindRandomPoint = 100;
                var curIsland = 0;
                Helper.ASync.awaitforof(this.result.islands, function (island, nextIsland) {
                    // try to create some filler on each island
                    var stop = false;
                    var grp = 0;
                    curIsland++;
                    updateActionLabel("Searching for locations to add terrain features on island " + (curIsland - 1));
                    // try to create up to maxgroups patches of terrain using poisson disc sampling
                    Helper.ASync.awaitwhile(function () { return grp < maxgroups && !stop; }, function (nextGroup) {
                        var curTerrain = Math.floor(_this.rnd.nextBetween(0, _this.terrains.length));
                        var pt = island.points[Math.floor(_this.rnd.nextBetween(0, island.points.length))];
                        // try to find a random point that's far enough from the shore and far enough from existing proximity points
                        var attempt = 0;
                        while (attempt < maxAttemptsToFindRandomPoint &&
                            (_this.result.islandData.nearWater(pt.x, pt.y, radiusFromShore)
                                || !_this.isFarEnough(pt, proximityPoints, minDistanceFromExistingPoints))) {
                            pt = island.points[Math.floor(_this.rnd.nextBetween(0, island.points.length))];
                            attempt++;
                        }
                        if (attempt == maxAttemptsToFindRandomPoint) {
                            // skip
                            stop = true;
                        }
                        else {
                            // we have a random point, now do poisson disc sampling
                            var pd = new Sampling.PoissonDisc(w, h, distanceBetweenPoints, maxAttemptsToFindRandomPoint, _this.rnd, function (x, y) { return !_this.result.islandData.nearWater(x, y, radiusFromShore)
                                && _this.isFarEnough(new Helper.Point(x, y), proximityPoints, minDistanceFromExistingPoints); });
                            pd.addInitialSample(pt.x, pt.y);
                            // if we have enough points also stop
                            while (!pd.isDone && pd.samples.length < nrOfPoints)
                                pd.step();
                            // draw the terrain of all points and add them to the existing proximity points
                            for (var _i = 0, _a = pd.samples; _i < _a.length; _i++) {
                                var pt_1 = _a[_i];
                                ctx.drawImage(_this.terrains[curTerrain], pt_1.x - terrainRadius, pt_1.y - terrainRadius, terrainRadius * 2, terrainRadius * 2);
                                onUpdate();
                                proximityPoints.push(new Helper.Point(pt_1.x, pt_1.y));
                            }
                            // choose a random terrain image next
                            curTerrain = Math.floor(_this.rnd.nextBetween(0, _this.terrains.length));
                        }
                        grp++;
                        nextGroup();
                    }, nextIsland);
                }, function () {
                    onUpdate();
                    onDone();
                });
            };
            TerrainRender.prototype.isFarEnough = function (pt, points, minDistance) {
                for (var _i = 0; _i < points.length; _i++) {
                    var p = points[_i];
                    if (pt.distanceTo(p) < minDistance)
                        return false;
                }
                return true;
            };
            return TerrainRender;
        })(Render);
        Renderers.TerrainRender = TerrainRender;
    })(Renderers || (Renderers = {}));
})(Main || (Main = {}));
var CellularAutomata;
(function (CellularAutomata) {
    var CARules = (function () {
        function CARules() {
            this.defaultCellDefinition = 0;
            this.neighbourRadius = 1;
            this.neighbourMode = "moore";
        }
        return CARules;
    })();
    var CALifeRules = (function (_super) {
        __extends(CALifeRules, _super);
        function CALifeRules(rulestring) {
            _super.call(this);
            this.survivalList = new Array(9);
            this.birthList = new Array(9);
            this.applyRules(rulestring);
            this.definitions = [
                new CellDefinition("dead", "#2244FF", true),
                new CellDefinition("alive", "#FFFFFF")
            ];
        }
        CALifeRules.prototype.applyRules = function (rulestring) {
            var parts = rulestring.split('/');
            for (var i = 0; i < 9; i++) {
                this.survivalList[i] = false;
                this.birthList[i] = false;
            }
            for (var i = 0; i < parts[0].length; i++) {
                this.survivalList[parseInt(parts[0].charAt(i))] = true;
            }
            for (var i = 0; i < parts[1].length; i++) {
                this.birthList[parseInt(parts[1].charAt(i))] = true;
            }
        };
        CALifeRules.prototype.onUpdate = function (cX, cY, cell, nextCell) {
            var ALIVE = 1;
            var DEAD = 0;
            var def = cell.definition;
            // cell neighbours are a double array
            // in the form [radius][definition], where
            // radius is the sum on all neighbours with that
            // specific radius around the cell
            var neighbourAliveCount = cell.neighbours[1][ALIVE];
            if (def == ALIVE) {
                if (this.survivalList[neighbourAliveCount]) {
                    //stay alive 
                    nextCell.definition = ALIVE;
                }
                else
                    nextCell.definition = DEAD;
            }
            else {
                if (this.birthList[neighbourAliveCount]) {
                    // become alive
                    nextCell.definition = ALIVE;
                }
                else
                    nextCell.definition = DEAD;
            }
        };
        return CALifeRules;
    })(CARules);
    CellularAutomata.CALifeRules = CALifeRules;
    var Cell = (function () {
        function Cell(definition, dirty) {
            this.definition = definition;
            this.dirty = dirty;
        }
        return Cell;
    })();
    var CellDefinition = (function () {
        function CellDefinition(name, color, transparent) {
            if (transparent === void 0) { transparent = false; }
            this.name = name;
            this.color = color;
            this.transparent = transparent;
        }
        CellDefinition.prototype.draw = function (ctx, x, y, width, height) {
            if (this.transparent) {
                ctx.clearRect(x, y, width, height);
            }
            else {
                ctx.fillStyle = this.color;
                ctx.fillRect(x, y, width, height);
            }
        };
        return CellDefinition;
    })();
    var CA = (function () {
        function CA(width, height, caRules, rnd) {
            this.width = width;
            this.height = height;
            this.caRules = caRules;
            this.rnd = rnd;
            this.generation = 0;
            this.board = this.createArray(caRules.definitions, caRules.defaultCellDefinition, caRules.neighbourRadius);
            this.board2 = this.createArray(caRules.definitions, caRules.defaultCellDefinition, caRules.neighbourRadius);
        }
        CA.prototype.getBoard = function () {
            return this.board;
        };
        CA.prototype.inBounds = function (x, y) {
            return x >= 0 && y >= 0 && x < this.width && y < this.height;
        };
        CA.prototype.createArray = function (cellDefinitions, defaultCellDefinition, neighbourRadius) {
            var arr = new Array(this.width);
            for (var a = 0; a < this.width; a++) {
                arr[a] = new Array(this.height);
                for (var b = 0; b < this.height; b++) {
                    arr[a][b] = new Cell(defaultCellDefinition, true);
                }
            }
            for (var a = 0; a < this.width; a++) {
                for (var b = 0; b < this.height; b++) {
                    arr[a][b].neighbours = this.getNeighbours(a, b, neighbourRadius, cellDefinitions, arr);
                }
            }
            return arr;
        };
        CA.prototype.draw = function (cScreen, ctx, showGrid, ignoreDirty) {
            if (ignoreDirty === void 0) { ignoreDirty = false; }
            var cellWidth = Math.round(cScreen.width / this.width);
            var cellHeight = Math.round(cScreen.height / this.height);
            ctx.beginPath();
            if (showGrid)
                this.drawGrid(cScreen, ctx, cellWidth, cellHeight);
            this.drawCells(cScreen, ctx, cellWidth, cellHeight, showGrid, ignoreDirty);
        };
        CA.prototype.drawGrid = function (cScreen, ctx, cellWidth, cellHeight) {
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 1;
            for (var i = 0; i <= cScreen.width; i += cellWidth) {
                ctx.moveTo(i + 0.5, 0 + 0.5);
                ctx.lineTo(i + 0.5, cScreen.height + 0.5);
            }
            for (var i = 0; i <= cScreen.height; i += cellHeight) {
                ctx.moveTo(0 + 0.5, i + 0.5);
                ctx.lineTo(cScreen.width + 0.5, i + 0.5);
            }
            ctx.stroke();
        };
        CA.prototype.drawCells = function (cScreen, ctx, cellWidth, cellHeight, showGrid, ignoreDirty) {
            if (ignoreDirty === void 0) { ignoreDirty = false; }
            var padding = showGrid ? 1 : 0;
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    var cell = this.board[x][y];
                    var def = this.caRules.definitions[cell.definition];
                    if ((ignoreDirty || cell.dirty)) {
                        def.draw(ctx, ~~(x * cellWidth) + padding, ~~(y * cellHeight) + padding, ~~(cellWidth - padding), ~~(cellHeight - padding));
                    }
                }
            }
        };
        CA.prototype.setCell = function (cX, cY, def) {
            if (this.inBounds(cX, cY)) {
                var oldCell = this.board[cX][cY];
                var oldDef = oldCell.definition;
                var dirty = oldCell.dirty || oldDef != def;
                var newCell = new Cell(def, dirty);
                newCell.definition = def;
                this.updateNeighbours(cX, cY, oldCell, newCell, this.caRules.neighbourRadius, this.board);
                oldCell.definition = def;
                oldCell.dirty = dirty;
            }
        };
        CA.prototype.getNeighbours = function (cX, cY, radius, cellDefinitions, arr) {
            var neighbours = new Array(this.caRules.neighbourRadius);
            for (var r = 0; r <= this.caRules.neighbourRadius; r++) {
                neighbours[r] = new Array(cellDefinitions.length);
                for (var d = 0; d < cellDefinitions.length; d++) {
                    neighbours[r][d] = 0;
                }
            }
            var minX = Math.max(cX - radius, 0);
            var maxX = Math.min(cX + radius, this.width - 1);
            var minY = Math.max(cY - radius, 0);
            var maxY = Math.min(cY + radius, this.height - 1);
            if (this.caRules.neighbourMode == "moore") {
                for (var j = minY; j <= maxY; j++) {
                    for (var i = minX; i <= maxX; i++) {
                        if (i != cX || j != cY) {
                            var curRad = Math.max(Math.abs(i - cX), Math.abs(j - cY));
                            var nCell = arr[i][j];
                            var nDefIdx = nCell.definition;
                            neighbours[curRad][nDefIdx] += 1;
                        }
                    }
                }
            }
            else if (this.caRules.neighbourMode == "vonneuman") {
                for (var i = minX; i <= maxX; i++) {
                    if (i != cX) {
                        var curRad = Math.abs(i - cX);
                        var nCell = arr[i][cY];
                        var nDefIdx = nCell.definition;
                        neighbours[curRad][nDefIdx] += 1;
                    }
                }
                for (var j = minY; j <= maxY; j++) {
                    if (j != cY) {
                        var curRad = Math.abs(j - cY);
                        var nCell = arr[cX][j];
                        var nDefIdx = nCell.definition;
                        neighbours[curRad][nDefIdx] += 1;
                    }
                }
            }
            return neighbours;
        };
        CA.prototype.updateNeighbours = function (cX, cY, cell, newCell, radius, board) {
            if (board === undefined)
                board = this.board2;
            var minX = Math.max(cX - radius, 0);
            var maxX = Math.min(cX + radius, this.width - 1);
            var minY = Math.max(cY - radius, 0);
            var maxY = Math.min(cY + radius, this.height - 1);
            var oldDefIdx = cell.definition;
            var oldDef = this.caRules.definitions[oldDefIdx];
            var newDefIdx = newCell.definition;
            var newDef = this.caRules.definitions[newDefIdx];
            if (this.caRules.neighbourMode == "moore") {
                for (var j = minY; j <= maxY; j++) {
                    for (var i = minX; i <= maxX; i++) {
                        if (i != cX || j != cY) {
                            var curRad = Math.max(Math.abs(i - cX), Math.abs(j - cY));
                            var nCell = board[i][j];
                            var neighboursOfRad = nCell.neighbours[curRad];
                            neighboursOfRad[oldDefIdx] -= 1;
                            neighboursOfRad[newDefIdx] += 1;
                        }
                    }
                }
            }
            else if (this.caRules.neighbourMode == "vonneuman") {
                for (var i = minX; i <= maxX; i++) {
                    if (i != cX) {
                        var curRad = Math.abs(i - cX);
                        var nCell = board[i][cY];
                        var neighboursOfRad = nCell.neighbours[curRad];
                        neighboursOfRad[oldDefIdx] -= 1;
                        neighboursOfRad[newDefIdx] += 1;
                    }
                }
                for (var j = minY; j <= maxY; j++) {
                    if (j != cY) {
                        var curRad = Math.abs(j - cY);
                        var nCell = board[cX][j];
                        var neighboursOfRad = nCell.neighbours[curRad];
                        neighboursOfRad[oldDefIdx] -= 1;
                        neighboursOfRad[newDefIdx] += 1;
                    }
                }
            }
        };
        CA.prototype.update = function () {
            this.copyNeighboursToNextState();
            var h = this.height;
            var w = this.width;
            var board = this.board;
            var board2 = this.board2;
            for (var x = 0; x < w; x++) {
                for (var y = 0; y < h; y++) {
                    var currentCell = board[x][y];
                    var nextCell = board2[x][y];
                    nextCell.dirty = false;
                    this.caRules.onUpdate(x, y, currentCell, nextCell);
                    if (nextCell.definition != currentCell.definition) {
                        nextCell.dirty = true;
                        this.updateNeighbours(x, y, currentCell, nextCell, this.caRules.neighbourRadius, this.board2);
                    }
                }
            }
            // swap boards
            var tmp = this.board2;
            this.board2 = this.board;
            this.board = tmp;
            this.generation++;
        };
        CA.prototype.copyNeighboursToNextState = function () {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    var neighbours = this.board[x][y].neighbours;
                    var nextCell = this.board2[x][y];
                    // don't slice, otherwise garbage collection is shitting bricks 
                    for (var r = 0; r < neighbours.length; r++) {
                        var len = neighbours[r].length;
                        for (var i = 0; i < len; i++) {
                            nextCell.neighbours[r][i] = neighbours[r][i];
                        }
                    }
                }
            }
        };
        CA.prototype.randomize = function (padding) {
            if (padding === void 0) { padding = 0; }
            this.generation = 0;
            for (var y = padding; y < this.height - padding; y++) {
                for (var x = padding; x < this.width - padding; x++) {
                    this.setCell(x, y, Math.floor(this.rnd.next() * this.caRules.definitions.length));
                }
            }
        };
        CA.prototype.clear = function () {
            this.generation = 0;
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    this.setCell(x, y, this.caRules.defaultCellDefinition);
                }
            }
        };
        return CA;
    })();
    CellularAutomata.CA = CA;
})(CellularAutomata || (CellularAutomata = {}));
var Noise;
(function (Noise) {
    /// <summary>
    /// A class that generates pseudo random values using the diamond square algoritm.
    /// The class lazy loads chunks based on the requested coordinates. Adjacent chunks
    /// are generated seamlessy by copying the borders of the already loaded chunks as initial
    /// seed for the current chunk.
    /// </summary>
    /// <param name='size'>The chunk size (in 2^x +1) </param>
    /// <param name='rougness'>The roughness parameter of the algorithm, [0f, 1f]</param>
    var DiamondSquare = (function () {
        function DiamondSquare(size, rnd, roughness) {
            if (roughness === void 0) { roughness = 1; }
            this.rnd = rnd;
            this.loadedValues = {};
            this.size = this.getNextMultipleOf2(size);
            this.roughness = roughness;
        }
        DiamondSquare.prototype.getNextMultipleOf2 = function (size) {
            var val = Math.log(size - 1) / Math.LN2;
            if (val != Math.round(val)) {
                return (Math.pow(2, Math.ceil(val))) + 1;
            }
            else
                return size;
        };
        /// <summary>
        /// Returns a value generated from the diamond square algorithm at given coordinates
        /// </summary>
        DiamondSquare.prototype.getValue = function (x, y) {
            // determine chunk coordinates
            var srcX = Math.floor(x / this.size);
            var srcY = Math.floor(y / this.size);
            var values = this.loadedValues[srcX + ";" + srcY];
            if (values === undefined) {
                // the chunk at given coordinates is not loaded yet
                // create the initial array for the chunk
                var initialArray = this.getInitialArray(this.loadedValues, srcX, srcY);
                // create the values for the current chunk
                values = this.generateArray(initialArray, this.loadedValues, srcX, srcY, this.roughness);
                // save the values
                this.loadedValues[srcX + ";" + srcY] = values;
            }
            // determine the x & y coordinates within the current chunk
            var arrX = (x + (1 + Math.floor(Math.abs(x / this.size))) * this.size) % this.size;
            var arrY = (y + (1 + Math.floor(Math.abs(y / this.size))) * this.size) % this.size;
            return values[arrX][arrY];
        };
        ;
        /// <summary>
        /// Creates an initial array for a chunk
        /// </summary>
        /// <param name='loadedValues'>The chunks already loaded</param>
        /// <param name='srcX'>The x coordinate of the chunk</param>
        /// <param name='srcY'>The y coordinate of the chunk</param>
        /// <returns>An initial array for a new chunk</returns>
        DiamondSquare.prototype.getInitialArray = function (loadedValues, srcX, srcY) {
            // allocate a new array for the chunk
            var values = new Array(this.size);
            for (var i = 0; i < this.size; i++) {
                values[i] = new Array(this.size);
            }
            // if the left chunk is loaded, copy its right side
            if (loadedValues[(srcX - 1) + ";" + (srcY)] !== undefined) {
                var prevValues = loadedValues[(srcX - 1) + ";" + (srcY)];
                // left side
                for (var i = 0; i < this.size; i++)
                    values[0][i] = prevValues[this.size - 1][i];
            }
            // if the right chunk is loaded, copy its left side
            if (loadedValues[(srcX + 1) + ";" + (srcY)] !== undefined) {
                var prevValues = loadedValues[(srcX + 1) + ";" + (srcY)];
                // right side
                for (var i = 0; i < this.size; i++)
                    values[this.size - 1][i] = prevValues[0][i];
            }
            // if the top chunk is loaded, copy its bottom side
            if (loadedValues[(srcX) + ";" + (srcY - 1)] !== undefined) {
                var prevValues = loadedValues[(srcX) + ";" + (srcY - 1)];
                // top side
                for (var i = 0; i < this.size; i++)
                    values[i][0] = prevValues[i][this.size - 1];
            }
            // if the bottom chunk is loaded, copy its top side
            if (loadedValues[(srcX) + ";" + (srcY + 1)] !== undefined) {
                var prevValues = loadedValues[(srcX) + ";" + (srcY + 1)];
                // bottom side
                for (var i = 0; i < this.size; i++)
                    values[i][this.size - 1] = prevValues[i][0];
            }
            // diagonals
            // if the left top chunk is loaded, copy its right bottom value
            if (loadedValues[(srcX - 1) + ";" + (srcY - 1)] !== undefined) {
                var prevValues = loadedValues[(srcX - 1) + ";" + (srcY - 1)];
                values[0][0] = prevValues[this.size - 1][this.size - 1];
            }
            // if the right top chunk is loaded, copy its left bottom value
            if (loadedValues[(srcX + 1) + ";" + (srcY - 1)] !== undefined) {
                var prevValues = loadedValues[(srcX + 1) + ";" + (srcY - 1)];
                values[this.size - 1][0] = prevValues[0][this.size - 1];
            }
            // if the left bottom chunk is loaded, copy its right top value
            if (loadedValues[(srcX - 1) + ";" + (srcY + 1)] !== undefined) {
                var prevValues = loadedValues[(srcX - 1) + ";" + (srcY + 1)];
                values[0][this.size - 1] = prevValues[this.size - 1][0];
            }
            // if the right bottom chunk is loaded, copy its left top value
            if (loadedValues[(srcX + 1) + ";" + (srcY + 1)] !== undefined) {
                var prevValues = loadedValues[(srcX + 1) + ";" + (srcY + 1)];
                values[this.size - 1][this.size - 1] = prevValues[0][0];
            }
            // if any of the corners are not initialised, give them random values
            if (values[0][0] === undefined)
                values[0][0] = this.rnd.next();
            if (values[this.size - 1][0] === undefined)
                values[this.size - 1][0] = this.rnd.next();
            if (values[0][this.size - 1] === undefined)
                values[0][this.size - 1] = this.rnd.next();
            if (values[this.size - 1][this.size - 1] === undefined)
                values[this.size - 1][this.size - 1] = this.rnd.next();
            return values;
        };
        /// <summary>
        /// Applies the diamond square algorithm on the given initial array for a chunk
        /// </summary>
        /// <param name='initialArray'>The initial array for the chunk to apply the algorithm on</param>
        /// <param name='loadedValues'>The loaded chunks</param>
        /// <param name='srcX'>The x coordinate of the chunk</param>
        /// <param name='srcY'>The y coordinate of the chunk</param>
        /// <returns>The filled in array</returns>
        DiamondSquare.prototype.generateArray = function (initialArray, loadedValues, srcX, srcY, roughness) {
            var appliedRoughness = roughness;
            var values = initialArray;
            // the algorithm is programmed in an iterative approach rather than a recursive one
            // the outer while loop keeps dividing its length into 2, until <= 2.
            // for each division the range of the random parameter is also halved
            // (like the fractal midpoint algorithm)
            // see http://www.gameprogrammer.com/fractal.html for more info
            var length = this.size;
            while (length > 2) {
                // perform diamond step
                for (var j = 0; j < this.size - 1; j += length - 1) {
                    for (var i = 0; i < this.size - 1; i += length - 1) {
                        // the square is i,j ------------ i + length -1, j
                        //               |                     |
                        //               |                     |
                        //              i + length -1 ----i + length -1, j + length - 1
                        // we need to calc point in the middle
                        var randomParam = ((2 * this.rnd.next()) - 1) * appliedRoughness;
                        // determine the center point of the square bounding box
                        var destX = Math.floor(i / 2 + (i + length - 1) / 2);
                        var destY = Math.floor(j / 2 + (j + length - 1) / 2);
                        // if the value isn't present already,
                        // set it to the average of the corner points and add the random parameter
                        if (values[destX][destY] === undefined) {
                            values[destX][destY] = DiamondSquare.average(values[i][j], values[i + length - 1][j], values[i][j + length - 1], values[i + length - 1][j + length - 1])
                                + randomParam;
                            // clip the values if they fall outside [0,1]
                            if (values[destX][destY] < 0)
                                values[destX][destY] = 0;
                            if (values[destX][destY] > 1)
                                values[destX][destY] = 1;
                        }
                    }
                }
                // done the diamond step
                // perform square step
                var halfsize = Math.floor(length / 2);
                for (var j = 0; j <= this.size - 1; j += halfsize) {
                    for (var i = (Math.floor(j / halfsize) % 2 === 0 ? halfsize : 0); i <= this.size - 1; i += length - 1) {
                        // for each square, determine midpoint of surrounding 4 diamonds
                        this.doDiamondOnMidpoint(values, i, j, length, appliedRoughness, loadedValues, srcX, srcY);
                    }
                }
                appliedRoughness = appliedRoughness / 2; //* (1 - ((roughness * (Math.pow(2, -roughness)))));
                length = Math.floor(((length - 1) / 2) + 1);
            }
            return values;
        };
        /// <summary>
        /// Applies the diamond step of the diamond square algorithm
        /// </summary>
        /// <param name='values'>The current array to fill data in</param>
        /// <param name='midpointX'>The center x coordinate of the square</param>
        /// <param name='midpointY'>The center y coordinate of the square</param>
        /// <param name='length'>The current length of a square</param>
        /// <param name='weight'>The current roughness to apply</param>
        /// <param name='srcX'>The x coordinate of the chunk</param>
        /// <param name='srcY'>The y coordinate of the chunk</param>
        DiamondSquare.prototype.doDiamondOnMidpoint = function (values, midpointX, midpointY, length, weight, loadedValues, srcX, srcY) {
            //if the target value isn't filled in yet
            if (values[midpointX][midpointY] === undefined) {
                // determine bounds of the square
                var halfLength = Math.floor(length / 2);
                var left = midpointX - halfLength;
                var right = midpointX + halfLength;
                var top = midpointY - halfLength;
                var bottom = midpointY + halfLength;
                // get the 4 required values.
                // at the edge of the chunk the values will need to be read from the adjacent chunks
                // if the adjactent chunks aren't loaded, some might be undefined. The average function
                // skips values that are undefined.
                //            pTop
                //        -----+-----
                //        |         |
                // pLeft  +    M    + pRight
                //        |         |
                //        -----+-----
                //           pBottom
                var pLeft = this.getValueRaw(loadedValues, left, midpointY, values, srcX, srcY);
                var pRight = this.getValueRaw(loadedValues, right, midpointY, values, srcX, srcY);
                var pTop = this.getValueRaw(loadedValues, midpointX, top, values, srcX, srcY);
                var pBottom = this.getValueRaw(loadedValues, midpointX, bottom, values, srcX, srcY);
                // determine random factor
                var randomParam = ((2 * this.rnd.next()) - 1) * weight;
                // determine resulting value by averaging the 4 points and adding the random factor
                var value = DiamondSquare.average(pLeft, pTop, pRight, pBottom) + randomParam;
                // clip the value if it falls outside [0,1]
                if (value < 0)
                    value = 0;
                if (value > 1)
                    value = 1;
                values[midpointX][midpointY] = value;
            }
        };
        /// <summary>
        /// Returns the value at the given x & y coordinates
        /// </summary>
        /// <param name='loadedValues'>The loaded chunks</param>
        /// <param name='x'>The x coordinate</param>
        /// <param name='y'>The y coordinate</param>
        /// <param name='curvalues'>The current array used for the new chunk</param>
        /// <param name='srcX'>The x coordinate of the chunk</param>
        /// <param name='srcY'>The y coordinate of the chunk</param>
        /// <returns>A value at the specified coordinates or undefined if the coordinates fall in an adjacent chunk that isn't loaded</returns>
        DiamondSquare.prototype.getValueRaw = function (loadedValues, x, y, curvalues, srcX, srcY) {
            // if the coordinates fall inside the chunk array, look up the value in the current array
            if (x >= 0 && y >= 0 && x < this.size && y < this.size)
                return curvalues[x][y];
            // determine the adjacent chunk coordinates
            var dstX = Math.floor((srcX * this.size + x) / this.size);
            var dstY = Math.floor((srcY * this.size + y) / this.size);
            // check if the chunk is loaded
            var values = loadedValues[dstX + ";" + dstY];
            if (values === undefined) {
                return undefined;
            }
            else {
                // determine the x & y position inside the adjacent chunk and return its value
                var arrX = x >= 0 ? x % this.size : (this.size - 1) - (Math.abs(x) % this.size);
                var arrY = y >= 0 ? y % this.size : (this.size - 1) - (Math.abs(y) % this.size);
                return values[arrX][arrY];
            }
        };
        /// <summary>
        /// Returns the average of the given points. If any of the points are undefined,
        /// they will be skipped
        /// </summary>
        /// <param name='p1'>The 1st value</param>
        /// <param name='p2'>The 2nd value</param>
        /// <param name='p3'>The 3rd value</param>
        /// <param name='p4'>The 4th value</param>
        /// <returns>An average of the given values</returns>
        DiamondSquare.average = function (p1, p2, p3, p4) {
            var sum = 0;
            var count = 0;
            if (p1 !== undefined) {
                sum += p1;
                count++;
            }
            if (p2 !== undefined) {
                sum += p2;
                count++;
            }
            if (p3 !== undefined) {
                sum += p3;
                count++;
            }
            if (p4 !== undefined) {
                sum += p4;
                count++;
            }
            return sum / count;
        };
        return DiamondSquare;
    })();
    Noise.DiamondSquare = DiamondSquare;
})(Noise || (Noise = {}));
var Sampling;
(function (Sampling) {
    // the size in pixels of the radius of the sample
    var SAMPLE_CIRCLE_RADIUS = 3;
    // Implementation based on http://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
    var PoissonDisc = (function () {
        function PoissonDisc(width, height, minDistance, nrSamplingAttempts, rnd, canAddSample) {
            this.rnd = rnd;
            this.samples = [];
            this.backgroundGrid = [];
            this.activeList = [];
            this.deepestSample = null;
            this.drawLinks = true;
            this.drawLinkColor = "white";
            this.width = width;
            this.height = height;
            this.minDistance = minDistance;
            this.nrSamplingAttempts = nrSamplingAttempts;
            this.canAddSample = canAddSample;
            // step 0: initialize a n-dimensional background grid
            this.initBackgroundGrid();
        }
        Object.defineProperty(PoissonDisc.prototype, "isDone", {
            get: function () { return this._isDone; },
            enumerable: true,
            configurable: true
        });
        PoissonDisc.prototype.getDeepestSample = function () {
            return this.deepestSample;
        };
        /**
         * Initializes the background grid and determines the cell size and how many rows & cols the grid has
         */
        PoissonDisc.prototype.initBackgroundGrid = function () {
            // ensure that there will only be at most 1 sample per cell in the background grid
            this.cellSize = this.minDistance; // / Math.sqrt(2));
            // determine the nr of cols & rows in the background grid
            this.nrCols = Math.ceil(this.width / this.cellSize);
            this.nrRows = Math.ceil(this.height / this.cellSize);
            for (var i = 0; i < this.nrCols; i++) {
                this.backgroundGrid[i] = [];
                for (var j = 0; j < this.nrRows; j++) {
                    this.backgroundGrid[i][j] = null;
                }
            }
        };
        PoissonDisc.prototype.addInitialSample = function (x, y) {
            var initSample = new Sample(x, y);
            this.addSample(initSample);
            this.deepestSample = initSample;
        };
        /**
         * Adds a valid sample to the various constructs of the algorithm
         */
        PoissonDisc.prototype.addSample = function (s) {
            var xIdx = Math.floor(s.x / this.width * this.nrCols);
            var yIdx = Math.floor(s.y / this.height * this.nrRows);
            this.backgroundGrid[xIdx][yIdx] = s;
            this.activeList.push(s);
            this.samples.push(s);
            s.drawTo(Main.Canvases.ctxOverlay, true);
        };
        /**
         * Chooses a sample from the active list and tries to find a random sample between its r and 2r radius
         * that is not too close to other samples, checked by looking nearby samples up in the background grid
         * If no sample could be determined within <nrSamples> then stop looking and return false. Also remove the
         * sample from the active list because it will never have any suitable samples to expand upon.
         *
         * @returns true if a sample was able to be found, otherwise false
         */
        PoissonDisc.prototype.step = function () {
            if (this.activeList.length <= 0) {
                this._isDone = true;
                return true;
            }
            // choose a random index from it
            var idx = Math.floor(this.rnd.next() * this.activeList.length);
            var s = this.activeList[idx];
            // generate up to nrSamples points uniformly from the spherical annullus between radius r and 2r (MIN_DISTANCE and 2 * MIN_DISTANCE)
            // around the chosen sample x_i
            // choose a point by creating a vector to the inner boundary
            // and multiplying it by a random value between [1-2]
            var initvX = this.minDistance;
            var initvY = 0;
            var k = 0;
            var found = false;
            // try finding a sample between r and 2r from the sample s, up to nrSamplingAttempts times
            while (k < this.nrSamplingAttempts && !found) {
                // ( cos  sin )    x ( vX  ) = ( cos * vX + sin * vY )
                // ( -sin cos )      ( vY )    ( -sin * vX + cos * vY)
                var angle = this.rnd.next() * 2 * Math.PI;
                var vX = Math.cos(angle) * initvX + Math.sin(angle) * initvY;
                var vY = -Math.sin(angle) * initvX + Math.cos(angle) * initvY;
                // the length of the vector is already the min radius, so multiplying between 1 and 2
                // gives a sample in the r - 2r band around s.
                var length = 1 + this.rnd.next(); // between 1 and 2
                var x = s.x + length * vX;
                var y = s.y + length * vY;
                var xIdx = Math.floor(x / this.width * this.nrCols);
                var yIdx = Math.floor(y / this.height * this.nrRows);
                if (x >= 0 && y >= 0 && x < this.width && y < this.height
                    && this.backgroundGrid[xIdx][yIdx] == null
                    && !this.containsSampleInBackgroundGrid(x, y) && this.canAddSample(x, y)) {
                    // adequately far from existing samples
                    var newSample = new Sample(x, y);
                    newSample.previousSample = s;
                    newSample.depth = s.depth + 1;
                    if (this.drawLinks) {
                        Main.Canvases.ctxOverlay.beginPath();
                        Main.Canvases.ctxOverlay.strokeStyle = this.drawLinkColor;
                        Main.Canvases.ctxOverlay.lineWidth = 2;
                        Main.Canvases.ctxOverlay.moveTo(s.x, s.y);
                        var xc = (s.x + newSample.x) / 2;
                        var yc = (s.y + newSample.y) / 2;
                        Main.Canvases.ctxOverlay.lineTo(newSample.x, newSample.y);
                        Main.Canvases.ctxOverlay.stroke();
                    }
                    if (this.deepestSample == null || newSample.depth > this.deepestSample.depth)
                        this.deepestSample = newSample;
                    this.addSample(newSample);
                    found = true;
                }
                k++;
            }
            if (!found) {
                // no suitable found, remove it from the active list
                this.activeList.splice(idx, 1);
                s.drawTo(Main.Canvases.ctxOverlay, false);
            }
            return found;
        };
        /**
         * Checks if there is a sample around the x,y sample that's closer than the minimum radius
         * using the background grid
         *
         * @returns true if there is a sample within the minimum radius, otherwise false
         */
        PoissonDisc.prototype.containsSampleInBackgroundGrid = function (x, y) {
            var xIdx = (x / this.width * this.nrCols);
            var yIdx = (y / this.height * this.nrRows);
            // determine the bounding box of the radius
            var lboundX = (x - this.minDistance) / this.width * this.nrCols;
            var lboundY = (y - this.minDistance) / this.height * this.nrRows;
            var uboundX = Math.ceil((x + this.minDistance) / this.width * this.nrCols);
            var uboundY = Math.ceil((y + this.minDistance) / this.height * this.nrRows);
            // make sure i,j falls within bounds
            if (lboundX < 0)
                lboundX = 0;
            if (lboundY < 0)
                lboundY = 0;
            if (uboundX >= this.nrCols)
                uboundX = this.nrCols - 1;
            if (uboundY >= this.nrRows)
                uboundY = this.nrRows - 1;
            for (var i = lboundX; i <= uboundX; i++) {
                for (var j = lboundY; j <= uboundY; j++) {
                    var sample = this.backgroundGrid[Math.floor(i)][Math.floor(j)];
                    // check if the cell contains a sample and if the distance is smaller than the minimum distance
                    if (sample != null &&
                        sample.distanceTo(x, y) < this.minDistance) {
                        return true; // short circuit if you don't need to draw the cells around the given x,y
                    }
                }
            }
            return false;
        };
        return PoissonDisc;
    })();
    Sampling.PoissonDisc = PoissonDisc;
    var Sample = (function () {
        function Sample(x, y) {
            this.previousSample = null;
            this.x = Math.floor(x);
            this.y = Math.floor(y);
            this.depth = 0;
        }
        Sample.prototype.drawTo = function (ctx, isActive) {
            ctx.beginPath();
            if (isActive)
                ctx.fillStyle = "#CCC";
            else
                ctx.fillStyle = "black";
            ctx.arc(this.x, this.y, SAMPLE_CIRCLE_RADIUS, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        };
        Sample.prototype.distanceTo = function (x, y) {
            return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y));
        };
        return Sample;
    })();
    Sampling.Sample = Sample;
    var Random = (function () {
        function Random(seed) {
            if (typeof seed === "undefined")
                seed = new Date().getTime();
            this.seed = seed;
        }
        Random.prototype.next = function () {
            // this is in no way uniformly distributed, so it's really a bad rng, but it's fast enough
            // and random enough
            var x = Math.sin(this.seed++) * 10000;
            return x - Math.floor(x);
        };
        Random.prototype.nextBetween = function (min, max) {
            return min + this.next() * (max - min);
        };
        return Random;
    })();
    Sampling.Random = Random;
})(Sampling || (Sampling = {}));
