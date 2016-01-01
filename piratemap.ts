window.onload = () => Main.initialize();

namespace Helper {

    export class Point {
        constructor(public x: number, public y: number) { }

        floor() {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
        }

        distanceTo(p2: Point) {
            return Math.sqrt((p2.x - this.x) * (p2.x - this.x) + (p2.y - this.y) * (p2.y - this.y));
        }
    }

    export class RGB {
        constructor(public r: number, public g: number, public b: number) {
            this.r = Math.round(r);
            this.g = Math.round(g);
            this.b = Math.round(b);
        }
        toString(): string {
            return `rgb(${this.r},${this.g},${this.b})`
        }
        static getBlend(alpha: number, c1: RGB, c2: RGB): RGB {
            let r, g, b: number;
            r = Math.floor(alpha * c1.r + (1 - alpha) * c2.r);
            g = Math.floor(alpha * c1.g + (1 - alpha) * c2.g);
            b = Math.floor(alpha * c1.b + (1 - alpha) * c2.b);

            return new RGB(r, g, b);
        }
    }

    export class ASync {
        private funcs: Function[] = [];
        private lastResult: any;
        static do(data: any, ...f: Function[]) {
            let a = new ASync();
            a.lastResult = data;
            for (let fn of f) {
                a.funcs.push(fn);
            }
            a.run();
        }

        static for(from: number, to: number, action: (i: number) => void, onDone: Function, delayMs: number = 0) {
            let i = from;
            let func = () => {
                action(i);
                i++;
                if (i < to)
                    window.setTimeout(func, delayMs);
                else
                    if (onDone) onDone();
            };
            func();
        }



        static awaitforof<T>(elements: T[], action: (el: T, next: Function) => void, onDone: Function, delayMs: number = 0) {
            let i = 0;
            let to = elements.length;
            let func = () => {
                let next = () => {
                    i++;
                    if (i < to)
                        window.setTimeout(func, delayMs);
                    else
                        if (onDone) onDone();
                };
                action(elements[i], next);

            };
            func();
        }

        static awaitwhile(check: () => boolean, action: (next: Function) => void, onDone: Function, delayMs: number = 0) {
            let func = () => {
                let next = () => {
                    if (check())
                        window.setTimeout(func, delayMs);
                    else
                        if (onDone) onDone();
                };
                action(next);

            };
            func();
        }


        static while(check: () => boolean, action: () => void, onDone: Function, delayMs: number = 0) {
            let func = () => {
                action();
                if (check())
                    window.setTimeout(func, delayMs);
                else
                    if (onDone) onDone();
            };
            func();
        }

        static sleep(ms: number, onDone: Function) {
            let func = () => {
                if (onDone)
                    window.setTimeout(onDone, ms);
            };
            func();
        }


        run() {

            if (this.funcs.length > 0) {
                let f = this.funcs.shift();
                f((r) => {
                    this.lastResult = r;
                    this.run();
                }, this.lastResult);
            }
        }
    }

    export class Perf {

        private static prevMark;
        static mark(name?: string) {
            let t1 = performance.now();

            if (Perf.prevMark && name) {
                console.log("Time between marks:" + ((t1 - Perf.prevMark)) + "ms for " + name);
            }
            Perf.prevMark = t1;
        }
    }

    export class Query {

        static getParameterByName(name: string): string {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    }
}


namespace Main {
    let colors = ['red', 'green', 'blue', 'yellow', 'cyan', 'pink'];
    let adornments: HTMLImageElement[] = [<HTMLImageElement>document.getElementById("adornment1"), <HTMLImageElement>document.getElementById("adornment2"), <HTMLImageElement>document.getElementById("adornment3")];
    let landmarks: LandmarkDefinition[];
    let terrains: HTMLImageElement[] = [<HTMLImageElement>document.getElementById("terrain1"), <HTMLImageElement>document.getElementById("terrain2")];

    let w = 800;
    let h = 800;


    export class Canvases {
        static cBuffer = <HTMLCanvasElement>document.getElementById("cBuffer");
        static ctxBuffer = <CanvasRenderingContext2D>Canvases.cBuffer.getContext("2d");
 
        // layer for the background
        static cBackground = <HTMLCanvasElement>document.getElementById("cBackground");
        static ctxBackground = <CanvasRenderingContext2D>Canvases.cBackground.getContext("2d");
 
        // layer for adornments
        static cAdornments = <HTMLCanvasElement>document.getElementById("cAdornments");
        static ctxAdornments = <CanvasRenderingContext2D>Canvases.cAdornments.getContext("2d");
 
        // layer for the cellular automata
        static cCA = <HTMLCanvasElement>document.getElementById("cCA");
        static ctxCA = <CanvasRenderingContext2D>Canvases.cCA.getContext("2d");
 
        // layer for path
        static cPath = <HTMLCanvasElement>document.getElementById("cPath");
        static ctxPath = <CanvasRenderingContext2D>Canvases.cPath.getContext("2d");
 
        // final stitched image
        static cFinal = <HTMLCanvasElement>document.getElementById("cFinal");
        static ctxFinal = <CanvasRenderingContext2D>Canvases.cFinal.getContext("2d");
 
        // overlay
        static cOverlay = <HTMLCanvasElement>document.getElementById("cOverlay");
        static ctxOverlay = <CanvasRenderingContext2D>Canvases.cOverlay.getContext("2d");

        static setSize(w: number, h: number) {
            let canvases: HTMLCanvasElement[] = [this.cBuffer, this.cBackground, this.cAdornments, this.cCA, this.cPath, this.cFinal, this.cOverlay];
            for (let c of canvases) {
                c.width = w;
                c.height = h;
            }
        }
    }

    // Generate landmarks to use
    function createLandmarks() {
        landmarks = [];

        let l = new LandmarkDefinition();
        l.idx = 0;
        l.image = <HTMLImageElement>document.getElementById("landmark1");
        l.prefix = "a";
        l.name = "deserted hut";
        l.description = "Well it was deserted when we buried the treasure at least. Who knows in what state it is now, be on your guard!";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 1;
        l.image = <HTMLImageElement>document.getElementById("landmark2");
        l.prefix = "a";
        l.name = "huge tree";
        l.description = "You know the kind I'm talking about, the ones you can create a three masted ship from.";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 2;
        l.image = <HTMLImageElement>document.getElementById("landmark3");
        l.prefix = "a";
        l.name = "pair of peculiar rocks";
        l.description = "Quite peculiar, in fact if bankers in your hometown were geologists you'd have found the treasure right here.";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 3;
        l.image = <HTMLImageElement>document.getElementById("landmark1");
        l.prefix = "a";
        l.name = "tribe of natives that like to eat pirate meat";
        l.description = "Run!";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 4;
        l.image = <HTMLImageElement>document.getElementById("landmark3");
        l.prefix = "a";
        l.name = "bunch of rocks piled up";
        l.description = "Yours truly went on rock hauling spree to make this, you better enjoy the view.";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 5;
        l.image = <HTMLImageElement>document.getElementById("landmark2");
        l.prefix = "a";
        l.name = "withered tree";
        l.description = "Now in hindsight using a withered tree might not have been the best of ideas for the longevity of this chart but hey, cap'n orders.";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 6;
        l.image = <HTMLImageElement>document.getElementById("landmark1");
        l.prefix = "a";
        l.name = "local tavern";
        l.description = "Now now, before you go boozing there's treasure to be found first!";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 7;
        l.image = <HTMLImageElement>document.getElementById("landmark3");
        l.prefix = "a";
        l.name = "scuplture that looks like random rock formation";
        l.description = "Anyone but the fine eye of the cap'n would say it was just a some rock formation.";
        landmarks.push(l);

        l = new LandmarkDefinition();
        l.idx = 8;
        l.image = <HTMLImageElement>document.getElementById("landmark2");
        l.prefix = "an";
        l.name = "oversized tree with a treehut in it";
        l.description = "Ah a land lover's crow nest, a poor imitation to a real one if you ask me.";
        landmarks.push(l);

    }

    // initializes the canvasses and starts the algorithm
    export function initialize() {
        Canvases.setSize(w, h);
        createLandmarks();

        // fetch the seed if specified in the query string
        let seedparam = Helper.Query.getParameterByName("seed");
        let seed = undefined;
        if (parseInt(seedparam) != Number.NaN)
            seed = parseInt(seedparam);
            
        // run the algorithm
        let algorithm: TreasureMapAlgorithm = new TreasureMapAlgorithm(seed);
        updateSeed(algorithm.seed + "");

        algorithm.run();
    }


    function updateActionLabel(action: string) {
        document.getElementById("lblAction").innerHTML = action;
    }

    function updateSeed(seed: string) {
        document.getElementById("lblSeed").innerHTML = seed;
    }

    function updateSteps(steps: string) {
        document.getElementById("txtSteps").innerHTML = steps;
    }

    export class TreasureMapAlgorithm {

        private _seed: number;
        public get seed() { return this._seed; }

        private rnd: Sampling.Random;

        private data: TreasureMapAlgorithmData;

        constructor(seed?: number) {
            if (seed)
                this._seed = seed;
            else
                this._seed = new Date().getTime();

            this.rnd = new Sampling.Random(this._seed);
        }

        public run() {

            this.data = new TreasureMapAlgorithmData();

            Helper.ASync.do(null,
                // create the background for the map
                next => {
                    let bgRender = new Renderers.BackgroundRender(this.rnd);
                    bgRender.render(w, h, Canvases.cBackground, Canvases.ctxBackground, this.onUpdate, next)
                },
                // create the islands with CA
                next => {
                    let caRender = new Renderers.CARender(this.rnd, 30);
                    caRender.render(w, h, Canvases.cCA, Canvases.ctxCA, this.onUpdate, next)
                },
                // store the result and determine the island data
                (next, islandArray: boolean[][]) => {
                    this.data.islandData = new IslandData(islandArray);

                    this.asyncGetIslands(islandArray, this.onUpdate, next);
                },
                // store the island search result after sorting by largest island first
                (next, islands: IslandSearchResult[]) => {
                    islands.sort((i1, i2) => i2.size - i1.size);
                    this.data.islands = islands;
                    console.log(islands.length + " islands found");

                    if (islands.length > 0) {
                        console.log("Largest island: " + islands[0].size);
                        next();
                    }
                },
                // determine a random point on the largest island
                (next) => {
                    updateActionLabel("Selecting random treasure point on largest island");

                    let randomPointOnLargestIsland: Helper.Point;
                    let i = 0;
                    do {
                        randomPointOnLargestIsland = this.data.islands[0].points[Math.floor(this.rnd.next() * this.data.islands[0].points.length)];
                    }
                    while (i < 1000 && this.data.islandData.nearWater(randomPointOnLargestIsland.x, randomPointOnLargestIsland.y, 40));

                    next(randomPointOnLargestIsland);
                },
                // store the point and build the treasure map trajectory
                (next, treasurePoint: Helper.Point) => {
                    this.data.treasurePoint = treasurePoint;
                    Canvases.ctxOverlay.clearRect(0, 0, w, h);
                    let trajectRender = new Renderers.TrajectRender(this.rnd, this.data.treasurePoint, this.data);
                    trajectRender.render(w, h, Canvases.cPath, Canvases.ctxPath, this.onUpdate, next);
                },
                // generate landmarks along the path
                (next, treasurePath: Sampling.Sample[]) => {
                    this.data.treasurePath = treasurePath;
                    Canvases.ctxOverlay.clearRect(0, 0, w, h);
                    let landmarkRender = new Renderers.LandmarkRender(this.rnd, landmarks, this.data);
                    landmarkRender.render(w, h, Canvases.cPath, Canvases.ctxPath, this.onUpdate, next);
                },
                // fill up the empty spaces on all islands with random terrain features
                (next, landmarkPoints: LandmarkPoint[]) => {
                    this.data.landmarks = landmarkPoints;

                    let terrainRender = new Renderers.TerrainRender(this.rnd, terrains, this.data);
                    terrainRender.render(w, h, Canvases.cPath, Canvases.ctxPath, this.onUpdate, next);
                },
                // generate the textual steps to find the treasure
                (next) => {

                    let stepsRender = new Renderers.StepsRender(this.rnd, landmarks, this.data);
                    stepsRender.render(w, h, Canvases.cPath, Canvases.ctxPath, this.onUpdate, next);
                },
                // add adornments in the sea
                (next, steps: string[]) => {
                    this.data.steps = steps;
                    updateSteps(this.data.steps.join("\n\n"));

                    let adornmentRender = new Renderers.AdornmentRender(this.rnd, adornments, this.data);
                    adornmentRender.render(w, h, Canvases.cAdornments, Canvases.ctxAdornments, this.onUpdate, next);
                },
                // finish by hiding the overlay
                (next) => {
                    updateActionLabel("Finished");
                    Canvases.cOverlay.setAttribute("class", "hidden");
                }
            );
        }

        private asyncGetIslands(islandArray: boolean[][], onUpdate: Function, onDone: Function) {

            // a simple iterative depth first algorithm to find all the different islands
            
            // keep track of which points we visited
            let visited: boolean[][];
            visited = new Array(w);
            for (let i: number = 0; i < w; i++) {
                visited[i] = new Array(h);
                for (let j: number = 0; j < h; j++) {
                    visited[i][j] = false;
                }
            }

            let curColorIdx = 0;
            var result: IslandSearchResult[] = [];
            
            // iterate all points
            Helper.ASync.for(0, w, i => {
                for (let j: number = 0; j < h; j++) {
                    
                    // as long as it's on an island and not visited yet
                    // that means we encountered a new island
                    if (islandArray[i][j] && !visited[i][j]) {

                        updateActionLabel("Searching for islands - " + result.length + " islands found so far");
                        let cur: IslandSearchResult = new IslandSearchResult();

                        let curColor: string = colors[curColorIdx];
                        Canvases.ctxOverlay.fillStyle = curColor;

                        // keep pushing points of the island on the same stack
                        // by adding each point's neighbours
                        let stack: Helper.Point[] = [];
                        stack.push(new Helper.Point(i, j));

                        while (stack.length > 0) {
                            let pt = stack.pop();
                            if (islandArray[pt.x][pt.y] && !visited[pt.x][pt.y]) {
                                if (islandArray[i, j]) {
                                    cur.points.push(pt);
                                    //highlight the islands
                                    Canvases.ctxOverlay.fillRect(pt.x, pt.y, 1, 1);
                                    cur.size++;
                                }
                                if (pt.x - 1 >= 0) stack.push(new Helper.Point(pt.x - 1, pt.y));
                                if (pt.x + 1 < w) stack.push(new Helper.Point(pt.x + 1, pt.y));
                                if (pt.y - 1 >= 0) stack.push(new Helper.Point(pt.x, pt.y - 1));
                                if (pt.y + 1 < h) stack.push(new Helper.Point(pt.x, pt.y + 1));

                                visited[pt.x][pt.y] = true;
                            }
                        }
                        
                        // if the stack runs out then we're finished with this island
                        result.push(cur);
                        curColorIdx = ++curColorIdx % colors.length;
                    }
                }
            }, () => onDone(result));
        }


        private onUpdate() {
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
                    pBuffer[i] = part;   // red
                    pBuffer[i + 1] = part; // green
                    pBuffer[i + 2] = part; // blue
                    // i+3 is alpha (the fourth element)
                }
                else if (adornmentsPixels[i + 3] != 0) {
                    var alpha = adornmentsPixels[i + 3] / 255;

                    var total = adornmentsPixels[i] - pBuffer[i] + adornmentsPixels[i + 1] - pBuffer[i + 1] + adornmentsPixels[i + 2] - pBuffer[i + 2];
                    var part = Math.floor(total / 3);
                    pBuffer[i] = Math.floor(pBuffer[i] * (1 - alpha) + part * alpha);   // red
                    pBuffer[i + 1] = Math.floor(pBuffer[i + 1] * (1 - alpha) + part * alpha); // green
                    pBuffer[i + 2] = Math.floor(pBuffer[i + 2] * (1 - alpha) + part * alpha); // blue
                    // i+3 is alpha (the fourth element)
                }
            }

            Canvases.ctxBuffer.putImageData(imgData, 0, 0);
            Canvases.ctxFinal.drawImage(Canvases.cBuffer, 0, 0);
            Canvases.ctxFinal.drawImage(Canvases.cPath, 0, 0);
        }


    }

    class LandmarkDefinition {
        public idx: number;
        public image: HTMLImageElement;
        public name: string;
        public prefix: string;
        public description: string;

        getDirectionText(left: boolean, direction: string, visitedLandmarkCount: number[], rnd: Sampling.Random): string {
            // Try to create some randomness to the sentences
            
            let verbs = "Move|Head|Walk|Travel|Journey".split('|');
            let verb = verbs[Math.floor(rnd.nextBetween(0, verbs.length))];
            let untils = "until you see|until you encounter|until you gaze upon|until you come across".split("|");
            let until = untils[Math.floor(rnd.nextBetween(0, untils.length))];
            let anothers = "yet another|another".split("|");

            let yetanother = visitedLandmarkCount[this.idx] > 0 ? ` ${anothers[Math.floor(rnd.nextBetween(0, anothers.length))]} ` : ` ${this.prefix} `;

            let side = left ? "left" : "right";
            let text = `${verb} ${direction} ${until}${yetanother}${this.name}.`;
            if (visitedLandmarkCount[this.idx] == 0 && this.description)
                text += " " + this.description;
            return text;
        }
    }

    class LandmarkPoint extends Helper.Point {
        public left: boolean;
        public landmarkDefinitionIdx: number;
        public trajectIndex: number;

        constructor(x: number, y: number) {
            super(x, y);
        }
    }

    class IslandData {
        constructor(public mask: boolean[][]) {

        }

        isIsland(x: number, y: number): boolean {
            x = Math.floor(x);
            y = Math.floor(y);
            return this.mask[x][y];
        }


        nearIsland(x: number, y: number, radius: number): boolean {
            for (let i: number = x - radius; i < x + radius; i++) {
                for (let j: number = y - radius; j < y + radius; j++) {
                    if (i >= 0 && j >= 0 && i < w && j < h) {
                        if (this.isIsland(i, j))
                            return true;
                    }
                    else
                        return true;
                }
            }
            return false;
        }

        nearWater(x: number, y: number, radius: number): boolean {
            for (let i: number = x - radius; i < x + radius; i++) {
                for (let j: number = y - radius; j < y + radius; j++) {
                    if (i >= 0 && j >= 0 && i < w && j < h) {
                        if (!this.isIsland(i, j))
                            return true;
                    }
                    else
                        return true;
                }
            }
            return false;
        }
    }

    class TreasureMapAlgorithmData {

        // the island mask generated by the CA, along with some methods to query if a specific point is on an island
        islandData: IslandData;
        
        // islands each with their point set, sorted on the largest island first
        islands: IslandSearchResult[];

        // the point on the map where the treasure lies
        treasurePoint: Helper.Point;
        // the longest path found from the treasure point to somewhere near the edge of the map
        treasurePath: Sampling.Sample[];

        // the landmarks generated along the traject
        landmarks: LandmarkPoint[];

        // the textual version that describes the traject
        steps: string[];
    }

    class IslandSearchResult {
        public size: number = 0;
        public points: Helper.Point[] = [];
    }

    namespace Renderers {
        export abstract class Render {
            constructor(protected rnd: Sampling.Random) {
            }

            abstract render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function);
        }


        export class CARender extends Render {

            private ca: CellularAutomata.CA<CellularAutomata.CALifeRules>;

            constructor(rnd: Sampling.Random, private initialPadding: number) {
                super(rnd);

                let caRules = new CellularAutomata.CALifeRules("23/3");
                // run a CA on half the width and height of the map
                // any larger would make it lag too much
                this.ca = new CellularAutomata.CA(w / 2, h / 2, caRules, this.rnd);
            }

            private getIslandArray(): boolean[][] {
                let cells = this.ca.getBoard();
                let arr = new Array(w);
                for (let i: number = 0; i < w; i++) {
                    arr[i] = new Array(h);
                    for (let j: number = 0; j < h; j++) {
                        if (cells[Math.floor(i / 2)][Math.floor(j / 2)].definition == 1) // ALIVE
                            arr[i][j] = true;
                    }
                }
                return arr;
            }

            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {
                this.ca.randomize(this.initialPadding);
                this.ca.draw(c, ctx, false, true);

                // tiny function so I can put each of the steps in a single line
                let advanceCA = () => {
                    this.ca.update();
                    this.ca.draw(c, ctx, false, false);
                    onUpdate();
                };

                Helper.ASync.do(null,
                    next => {
                        // amoeba 
                        updateActionLabel("Running CA 150x 5678/35678 (Amoeba)");
                        this.ca.caRules.applyRules("5678/35678");
                        Helper.ASync.for(0, 150, i => advanceCA(), next);
                    },
                    next => {
                        // smooth edges
                        updateActionLabel("Running CA 2x 123/01234 (Smooth edges)");
                        this.ca.caRules.applyRules("123/01234");
                        Helper.ASync.for(0, 2, i => advanceCA(), next);
                    },
                    next => {
                        // roughen edges again
                        updateActionLabel("Running CA 80x 5678/3 (Roughen edges)");
                        this.ca.caRules.applyRules("5678/3");
                        Helper.ASync.for(0, 80, i => advanceCA(), next);
                    },
                    next => {
                        // remove individual cells and other "noise"
                        updateActionLabel("Running CA 20x 3456789/ (Remove invidual cells and other noise)");
                        this.ca.caRules.applyRules("3456789/");
                        Helper.ASync.for(0, 20, i => advanceCA(), next);
                    },
                    next => {
                        // pass along an island array for the next handler in the chain
                        onDone(this.getIslandArray());
                    });
            }
        }

        export class BackgroundRender extends Render {
            private percentageTorn: number = 0.02;

            constructor(rnd: Sampling.Random) {
                super(rnd);
            }

            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {
            
                // c1 is the base color, c2 and c3 are darker and lighter colors for the noise
                let c1 = new Helper.RGB(231, 217, 191);
                let c2 = new Helper.RGB(150, 120, 100);
                let c3 = new Helper.RGB(193, 167, 127);

                let percentageChancheLighterNoise = 0.5;
                let percentageChancheDarkerNoise = 0.5;
            
                // reduce the opacity of the DS algorithm noise by multiplying with these values
                let lighternoiseEffectiveness = 0.7;
                let darkernoiseEffectiveness = 0.4;

                let lighterNoiseRoughness = 40;
                let darkerNoiseRoughness = 40;
            
                // fill the background with the base color
                ctx.fillStyle = c1.toString();
                ctx.fillRect(0, 0, w, h);

                updateActionLabel("Generating background");

                let dsForLighterNoise;
                let dsForDarkerNoise;

                let self = this;
                Helper.ASync.do(null,
                    (next) => {
                        updateActionLabel("Generating diamond square noise 1");
                        dsForLighterNoise = new Noise.DiamondSquare(w, this.rnd, lighterNoiseRoughness);
                        next();
                    },
                    (next) => {
                        updateActionLabel("Generating diamond square noise 2");
                        dsForDarkerNoise = new Noise.DiamondSquare(w, this.rnd, darkerNoiseRoughness);
                        next();
                    },
                    (next) => {
                        updateActionLabel("Rendering background");
                        let cur = Math.floor(this.rnd.next() * 255);

                        let idx = 0;
                        let imgData = ctx.getImageData(0, 0, w, h);
                        Helper.ASync.for(0, h, j => {
                            for (let i: number = 0; i < w; i++) {

                                let dsLight = dsForLighterNoise.getValue(i, j);
                                let dsDark = dsForDarkerNoise.getValue(i, j);

                                // randomly put noise 
                                if (this.rnd.next() < percentageChancheLighterNoise) {
                                    let c = Helper.RGB.getBlend(1 - (dsLight * this.rnd.next() * lighternoiseEffectiveness), c1, c3);
                                    imgData.data[idx++] = c.r;
                                    imgData.data[idx++] = c.g;
                                    imgData.data[idx++] = c.b;
                                    idx++;
                                }
                                else if (this.rnd.next() < percentageChancheDarkerNoise) {
                                    let c = Helper.RGB.getBlend(1 - (dsDark * this.rnd.next() * darkernoiseEffectiveness), c1, c2);
                                    imgData.data[idx++] = c.r;
                                    imgData.data[idx++] = c.g;
                                    imgData.data[idx++] = c.b;
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
                        }, () => {
                            ctx.putImageData(imgData, 0, 0);
                            onUpdate();
                            next();
                        });
                    },
                    next => {
                        ctx.fillStyle = "white";

                        let minBaseWidth = 5;
                        let maxBaseWidth = 20;
                        let minTearHeight = 5;
                        let maxTearHeight = 20;
                        // tear top
                        for (let i: number = 0; i < this.percentageTorn * w; i++) {
                            let x = Math.floor(this.rnd.next() * w);
                            let tearBaseWidth = this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                            let tearHeight = this.rnd.nextBetween(minTearHeight, maxTearHeight);

                            ctx.beginPath();
                            ctx.moveTo(x - tearBaseWidth / 2, 0);
                            ctx.lineTo(x, tearHeight);
                            ctx.lineTo(x + tearBaseWidth / 2, 0);
                            ctx.fill();
                        }
                        // tear bottom
                        for (let i: number = 0; i < this.percentageTorn * w; i++) {
                            let x = Math.floor(this.rnd.next() * w);
                            let tearBaseWidth = this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                            let tearHeight = this.rnd.nextBetween(minTearHeight, maxTearHeight);

                            ctx.beginPath();
                            ctx.moveTo(x - tearBaseWidth / 2, h);
                            ctx.lineTo(x, h - tearHeight);
                            ctx.lineTo(x + tearBaseWidth / 2, h);
                            ctx.fill();
                        }
                        // tear left
                        for (let i: number = 0; i < this.percentageTorn * h; i++) {
                            let y = Math.floor(this.rnd.next() * w);
                            let tearBaseWidth = this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                            let tearHeight = this.rnd.nextBetween(minTearHeight, maxTearHeight);

                            ctx.beginPath();
                            ctx.moveTo(0, y - tearBaseWidth / 2);
                            ctx.lineTo(tearHeight, y);
                            ctx.lineTo(0, y + tearBaseWidth / 2);
                            ctx.fill();
                        }
                        // tear right
                        for (let i: number = 0; i < this.percentageTorn * h; i++) {
                            let y = Math.floor(this.rnd.next() * w);
                            let tearBaseWidth = this.rnd.nextBetween(minBaseWidth, maxBaseWidth);
                            let tearHeight = this.rnd.nextBetween(minTearHeight, maxTearHeight);

                            ctx.beginPath();
                            ctx.moveTo(w, y - tearBaseWidth / 2);
                            ctx.lineTo(w - tearHeight, y);
                            ctx.lineTo(w, y + tearBaseWidth / 2);
                            ctx.fill();
                        }
                        next();
                    },
                    (next) => {

                        onUpdate();
                        onDone();
                    });
            }
        }

        export class TrajectRender extends Render {

            constructor(rnd: Sampling.Random, private startingPoint: Helper.Point, private result: TreasureMapAlgorithmData) {
                super(rnd);
            }

            private static DELAY = 25;
            private static MIN_RADIUS_FROM_WATER: number = 10;
            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {
                let pd = new Sampling.PoissonDisc(w, h, 10, 1000, this.rnd, (x, y) => this.result.islandData.isIsland(x, y) && !this.result.islandData.nearWater(x, y, TrajectRender.MIN_RADIUS_FROM_WATER));
                pd.drawLinkColor = "white";
                pd.drawLinks = true;

                pd.addInitialSample(this.startingPoint.x, this.startingPoint.y);


                let traject: Sampling.Sample[];

                Helper.ASync.do(null,
                    next => {
                        updateActionLabel("Searching for deepest poisson disc sampling path");
                        Helper.ASync.while(() => !pd.isDone, () => pd.step(), next)
                    },
                    next => {
                        updateActionLabel("Following traject to treasure point");
                        ctx.beginPath();
                        ctx.lineWidth = 3;
                        ctx.setLineDash([5, 10]);

                        let s = pd.getDeepestSample();
                        let prevSample = s.previousSample;
                        let oldx = s.x;
                        let oldy = s.y;

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

                        Helper.ASync.while(() => s != null && prevSample != null, () => {
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

                    },
                    next => {
                        updateActionLabel("Drawing big X");

                        let treasurePoint = traject[traject.length - 1];
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
                    },
                    next => {
                        onUpdate();
                        // pass along the traject samples
                        onDone(traject);
                    });
            }
        }

        export class AdornmentRender extends Render {

            private curAdornment = 0;
            constructor(rnd: Sampling.Random, private adornments: HTMLImageElement[], private result: TreasureMapAlgorithmData) {
                super(rnd);
            }

            private minAdornmentRadius = 40;
            private limitAttemptsInitialPoint = 1000;

            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {
                let pd = new Sampling.PoissonDisc(w, h, Math.floor(w / 4), 1000, this.rnd, (x, y) => !this.result.islandData.nearIsland(x, y, this.minAdornmentRadius));

                pd.drawLinks = false;
                let initx, inity: number;
                let initSampleFound: boolean = false;
                let hardLimit = 0;
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

                Helper.ASync.do(null,
                    next => {
                        updateActionLabel("Sampling adornment points outside islands with poisson disc sampling");
                        Helper.ASync.while(() => !pd.isDone, () => pd.step(), next, 25)
                    },
                    next => {
                        updateActionLabel("Drawing adornments on the sampling points");
                    
                        // draw adornments in sequence on all the points found
                        for (let s of pd.samples) {
                            ctx.drawImage(this.adornments[this.curAdornment], s.x - this.minAdornmentRadius, s.y - this.minAdornmentRadius, this.minAdornmentRadius * 2, this.minAdornmentRadius * 2);
                            onUpdate();
                            this.curAdornment = ++this.curAdornment % this.adornments.length;
                        }
                        next();
                    },
                    next => {
                        onUpdate();
                        onDone();
                    });
            }
        }

        export class LandmarkRender extends Render {

            private landMarkRadius: number = 16;
            private maxLandmarksAlongTraject: number = 10;
            private maxStepsAway = 2;
            private minDistanceProximity = 15; // pixels;
            private minDistanceFromShore = 10;


            private LOOP_DELAY: number = 10;

            constructor(rnd: Sampling.Random, private landmarks: LandmarkDefinition[], private result: TreasureMapAlgorithmData) {
                super(rnd);
            }

            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {



                Canvases.ctxOverlay.fillStyle = "black";
                Canvases.ctxOverlay.strokeStyle = "white";
                Canvases.ctxOverlay.lineWidth = 3;


                let trajectPoints: Helper.Point[] = [];
                for (let s of this.result.treasurePath)
                    trajectPoints.push(new Helper.Point(s.x, s.y));


                // determine the total length of the traject 
                // and divide it by the max number of landmarks there should be
                // that'll be the average distance that needs to be between the 
                // already placed landmarks
                let totalTrajectLength = this.getTotalLengthOfTraject();
                let minDistanceFromOtherLandmarks = Math.floor(totalTrajectLength / this.maxLandmarksAlongTraject);

                updateActionLabel("Calculating positions to place landmarks along the path");
                let possibleLandmarkPoints: LandmarkPoint[] = [];
                Helper.ASync.do(null,
                    next => {
                        Helper.ASync.for(0, this.result.treasurePath.length - 1, i => {

                            let p1 = this.result.treasurePath[i];
                            let p2 = this.result.treasurePath[i + 1];

                            let v = new Helper.Point(p2.x - p1.x, p2.y - p1.y);
                            // [ cos &   -sin &  ] [x]
                            // [ sin &   cos &  ] [y]
                            let angle = Math.PI / 4;
                            // create 90° vector
                            let vrot90 = new Helper.Point(Math.cos(angle) * v.x - Math.sin(angle) * v.y, Math.sin(angle) * v.x + Math.cos(angle) * v.y);

                            //choose random nr of steps (length between sampling points of the traject = 1 step) 
                            let stepsAway = this.rnd.nextBetween(1.5, this.maxStepsAway);


                            // choose a point on the right side of the traject
                            let possPoint1 = new LandmarkPoint(p1.x + vrot90.x * stepsAway, p1.y + vrot90.y * stepsAway);
                            possPoint1.trajectIndex = i;
                            possPoint1.left = false;
                            possPoint1.landmarkDefinitionIdx = Math.floor(this.rnd.next() * this.landmarks.length);
                            possPoint1.floor();

                            // and a point on the left side
                            let possPoint2 = new LandmarkPoint(p1.x - vrot90.x * stepsAway, p1.y - vrot90.y * stepsAway);
                            possPoint2.trajectIndex = i;
                            possPoint2.left = true;
                            possPoint2.landmarkDefinitionIdx = Math.floor(this.rnd.next() * this.landmarks.length);
                            possPoint2.floor();

                            // both points have to adhere to some criteria:
                            // - it needs to be on an island and not near a shore so the entire image falls inside the island
                            // - it needs to be both har enough from the trajectory (so it doesn't overlap) and from already placed landmark points
    
                            if (this.result.islandData.isIsland(possPoint1.x, possPoint1.y) &&
                                !this.result.islandData.nearWater(possPoint1.x, possPoint1.y, this.minDistanceFromShore) &&
                                this.isFarEnough(possPoint1, trajectPoints, this.minDistanceProximity) &&
                                this.isFarEnough(possPoint1, possibleLandmarkPoints, minDistanceFromOtherLandmarks)) {

                                // draw a dot on the overlay
                                Canvases.ctxOverlay.beginPath();
                                Canvases.ctxOverlay.arc(possPoint1.x, possPoint1.y, 5, 0, 2 * Math.PI, false);
                                Canvases.ctxOverlay.fill();
                                Canvases.ctxOverlay.stroke();

                                possibleLandmarkPoints.push(possPoint1);
                            }

                            if (this.result.islandData.isIsland(possPoint2.x, possPoint2.y) &&
                                !this.result.islandData.nearWater(possPoint2.x, possPoint2.y, this.minDistanceFromShore) &&
                                this.isFarEnough(possPoint2, trajectPoints, this.minDistanceProximity) &&
                                this.isFarEnough(possPoint2, possibleLandmarkPoints, minDistanceFromOtherLandmarks)) {

                                // draw a dot on the overlay
                                Canvases.ctxOverlay.beginPath();
                                Canvases.ctxOverlay.arc(possPoint2.x, possPoint2.y, 5, 0, 2 * Math.PI, false);
                                Canvases.ctxOverlay.fill();
                                Canvases.ctxOverlay.stroke();

                                possibleLandmarkPoints.push(possPoint2);
                            }

                        }, next, this.LOOP_DELAY);
                    },
                    next => {

                        // now draw the landmarks 
                        for (let pt of possibleLandmarkPoints) {
                            let landmarkDefinition = this.landmarks[pt.landmarkDefinitionIdx];
                            ctx.drawImage(landmarkDefinition.image, pt.x - this.landMarkRadius, pt.y - this.landMarkRadius, this.landMarkRadius * 2, this.landMarkRadius * 2);
                            onUpdate();
                        }

                        next();
                    },
                    next => {
                        onUpdate();
                        onDone(possibleLandmarkPoints);
                    });
            }

            private getTotalLengthOfTraject(): number {
                let length = 0;
                for (let i: number = 0; i < this.result.treasurePath.length - 1; i++) {
                    let p = this.result.treasurePath[i + 1];
                    length += this.result.treasurePath[i].distanceTo(p.x, p.y);
                }
                return length;
            }
            private isFarEnough(pt: Helper.Point, points: Helper.Point[], minDistance: number): boolean {
                for (let p of points) {
                    if (pt.distanceTo(p) < minDistance)
                        return false;
                }
                return true;
            }
        }

        export class StepsRender extends Render {

            constructor(rnd: Sampling.Random, private landmarkDefinitions: LandmarkDefinition[], private result: TreasureMapAlgorithmData) {
                super(rnd);
            }

            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {


                let steps: string[] = [];

                // start at the first point of the traject
                let curTrajectIdx = 0;

                // intialize a nr of times visited array per landmark so this can be checked in the creation of the description
                let visitedLandMarkCount: number[] = new Array(this.landmarkDefinitions.length);
                for (let i: number = 0; i < this.landmarkDefinitions.length; i++) {
                    visitedLandMarkCount[i] = 0;
                }

                // go over all landmarks (except the last one) and calculate the vector between 2 landmarks
                // that vector will be the direction vector
                for (let i: number = 0; i < this.result.landmarks.length - 1; i++) {
                    let curLandMark = this.result.landmarks[i];


                    let nextTrajectIdx = curLandMark.trajectIndex;
                    // direction between 2 landmark points
                    let direction = this.getDirection(curTrajectIdx, nextTrajectIdx - curTrajectIdx);

                    curTrajectIdx = nextTrajectIdx;
                    // now push the landmark random generated text to the steps
                    let landmarkDefinition = this.landmarkDefinitions[curLandMark.landmarkDefinitionIdx];
                    steps.push(landmarkDefinition.getDirectionText(curLandMark.left, direction, visitedLandMarkCount, this.rnd));

                    visitedLandMarkCount[curLandMark.landmarkDefinitionIdx]++;
                }

                steps.push("You're almost there!");
                // add the last landmark, this will create a vector to the actual treasure
                // point
                let lastLandmark = this.result.landmarks[this.result.landmarks.length - 1];
                let lastLandmarkDefinition = this.landmarkDefinitions[lastLandmark.landmarkDefinitionIdx];
                let lastDirection = this.getDirection(curTrajectIdx, this.result.treasurePath.length - curTrajectIdx);
                steps.push(lastLandmarkDefinition.getDirectionText(lastLandmark.left, lastDirection, visitedLandMarkCount, this.rnd));

                // now a landmark can be a bit away so finalize with taking steps
                // to the actual point
                let dist = Math.floor(this.result.treasurePath[lastLandmark.trajectIndex].distanceTo(this.result.treasurePoint.x, this.result.treasurePoint.y));
                let toTreasureVx = this.result.treasurePoint.x - this.result.treasurePath[lastLandmark.trajectIndex].x;
                let toTreasureVy = this.result.treasurePoint.y - this.result.treasurePath[lastLandmark.trajectIndex].y;
                let toTreasureDir = this.getDirectionFromVector(toTreasureVx, toTreasureVy);
                steps.push(`Now take ${dist} steps ${toTreasureDir} from there and start digging!`);

                onDone(steps);
            }

            private getDirection(curIdx: number, maxlookahead: number): string {
                // average all vectors along the traject between the curIdx and the curIdx + maxlookahead
                // points, that'll give us the average direction
                let path = this.result.treasurePath;

                let count = 0;
                let sumvx = 0;
                let sumvy = 0;
                for (let i: number = 1; i <= maxlookahead && curIdx + i < path.length; i++) {

                    let prevPoint = path[curIdx + i - 1];
                    let nextPoint = path[curIdx + i];
                    let vx = nextPoint.x - prevPoint.x;
                    let vy = nextPoint.y - prevPoint.y;
                    sumvx += vx;
                    sumvy += vy;
                    count++;
                }
                let avgx = sumvx / count;
                let avgy = sumvy / count;

                return this.getDirectionFromVector(avgx, avgy);
            }

            private getDirectionFromVector(vx: number, vy: number): string {
                let pi = Math.PI;
                let angle = Math.atan2(vy, vx);
                if (angle < 0) angle += 2 * Math.PI;

                if (angle < 1 / 8 * pi || angle > 2 * pi - 1 / 8 * pi)
                    return "east";
                else if (angle < 3 / 8 * pi)
                    return "south east";
                else if (angle < 5 / 8 * pi)
                    return "south";
                else if (angle < 7 / 8 * pi)
                    return "south west";
                else if (angle < 9 / 8 * pi)
                    return "west"
                else if (angle < 11 / 8 * pi)
                    return "north west";
                else if (angle < 13 / 8 * pi)
                    return "north";
                else
                    return "north east";
            }
        }

        export class TerrainRender extends Render {

            constructor(rnd: Sampling.Random, private terrains: HTMLImageElement[], private result: TreasureMapAlgorithmData) {
                super(rnd);
            }

            render(w: number, h: number, c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onUpdate: Function, onDone: Function) {
                // list all points that the terrain should stay away from
                let proximityPoints: Helper.Point[] = [];
                for (let s of this.result.treasurePath)
                    proximityPoints.push(new Helper.Point(s.x, s.y));

                for (let pt of this.result.landmarks) {
                    proximityPoints.push(new Helper.Point(pt.x, pt.y));
                }

                let radiusFromShore = 20;
                let minDistanceFromExistingPoints = 50;

                let distanceBetweenPoints = 20;
                let nrOfPoints = 20;
                let terrainRadius = 16;
                let maxgroups = 5;

                let maxAttemptsToFindRandomPoint = 100;

                let curIsland = 0;
                Helper.ASync.awaitforof(this.result.islands, (island, nextIsland) => {

                    // try to create some filler on each island
                    let stop = false;

                    let grp: number = 0;
                    curIsland++;
                    updateActionLabel("Searching for locations to add terrain features on island " + (curIsland - 1));
                
                    // try to create up to maxgroups patches of terrain using poisson disc sampling
                    Helper.ASync.awaitwhile(() => grp < maxgroups && !stop, nextGroup => {

                        let curTerrain = Math.floor(this.rnd.nextBetween(0, this.terrains.length));
                        let pt = island.points[Math.floor(this.rnd.nextBetween(0, island.points.length))];

                        // try to find a random point that's far enough from the shore and far enough from existing proximity points
                        let attempt = 0;
                        while (attempt < maxAttemptsToFindRandomPoint &&
                            (this.result.islandData.nearWater(pt.x, pt.y, radiusFromShore)
                                || !this.isFarEnough(pt, proximityPoints, minDistanceFromExistingPoints))) {
                            pt = island.points[Math.floor(this.rnd.nextBetween(0, island.points.length))];
                            attempt++;
                        }

                        if (attempt == maxAttemptsToFindRandomPoint) {
                            // skip
                            stop = true;
                        }
                        else {
                            // we have a random point, now do poisson disc sampling
                            let pd = new Sampling.PoissonDisc(w, h, distanceBetweenPoints, maxAttemptsToFindRandomPoint, this.rnd,
                                (x, y) => !this.result.islandData.nearWater(x, y, radiusFromShore)
                                    && this.isFarEnough(new Helper.Point(x, y), proximityPoints, minDistanceFromExistingPoints));

                            pd.addInitialSample(pt.x, pt.y);

                            // if we have enough points also stop
                            while (!pd.isDone && pd.samples.length < nrOfPoints)
                                pd.step();

                            // draw the terrain of all points and add them to the existing proximity points
                            for (let pt of pd.samples) {
                                ctx.drawImage(this.terrains[curTerrain], pt.x - terrainRadius, pt.y - terrainRadius, terrainRadius * 2, terrainRadius * 2);
                                onUpdate();
                                proximityPoints.push(new Helper.Point(pt.x, pt.y));
                            }
                            // choose a random terrain image next
                            curTerrain = Math.floor(this.rnd.nextBetween(0, this.terrains.length));
                        }
                        grp++;
                        nextGroup();

                    }, nextIsland);
                }, () => {
                    onUpdate();
                    onDone();
                });
            }

            private isFarEnough(pt: Helper.Point, points: Helper.Point[], minDistance: number): boolean {
                for (let p of points) {
                    if (pt.distanceTo(p) < minDistance)
                        return false;
                }
                return true;
            }
        }
    }
}



namespace CellularAutomata {

    abstract class CARules {

        public defaultCellDefinition = 0;
        public neighbourRadius = 1;
        public definitions: CellDefinition[];
        public neighbourMode = "moore";

        abstract onUpdate(cX: number, cY: number, cell: Cell, nextCell: Cell);
    }

    export class CALifeRules extends CARules {

        private survivalList: boolean[] = new Array(9);
        private birthList: boolean[] = new Array(9);
        constructor(rulestring: string) {
            super();
            this.applyRules(rulestring);

            this.definitions = [
                new CellDefinition("dead", "#2244FF", true),
                new CellDefinition("alive", "#FFFFFF")
            ];
        }

        applyRules(rulestring: string) {
            let parts = rulestring.split('/');

            for (let i = 0; i < 9; i++) {
                this.survivalList[i] = false;
                this.birthList[i] = false;
            }

            for (let i = 0; i < parts[0].length; i++) {
                this.survivalList[parseInt(parts[0].charAt(i))] = true;
            }

            for (let i = 0; i < parts[1].length; i++) {
                this.birthList[parseInt(parts[1].charAt(i))] = true;
            }
        }

        onUpdate(cX: number, cY: number, cell: Cell, nextCell: Cell) {
            let ALIVE = 1;
            let DEAD = 0;

            let def = cell.definition;
            // cell neighbours are a double array
            // in the form [radius][definition], where
            // radius is the sum on all neighbours with that
            // specific radius around the cell
            let neighbourAliveCount = cell.neighbours[1][ALIVE];

            if (def == ALIVE) {

                if (this.survivalList[neighbourAliveCount]) {
                    //stay alive 
                    nextCell.definition = ALIVE;
                } else
                    nextCell.definition = DEAD;
            } else {
                if (this.birthList[neighbourAliveCount]) {
                    // become alive
                    nextCell.definition = ALIVE;
                } else
                    nextCell.definition = DEAD;

            }
        }
    }

    class Cell {

        public neighbours: number[][];
        constructor(public definition: number, public dirty: boolean) {

        }
    }

    class CellDefinition {
        constructor(public name: string, public color: string, public transparent: boolean = false) {

        }

        draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
            if (this.transparent) {
                ctx.clearRect(x, y, width, height);
            }
            else {
                ctx.fillStyle = this.color;
                ctx.fillRect(x, y, width, height);
            }
        }
    }

    export class CA<T extends CARules> {

        public generation: number = 0;


        private board: Cell[][];
        private board2: Cell[][];

        getBoard(): Cell[][] {
            return this.board;
        }

        constructor(public width: number, public height: number, public caRules: T, private rnd: Sampling.Random) {
            this.board = this.createArray(caRules.definitions, caRules.defaultCellDefinition, caRules.neighbourRadius);
            this.board2 = this.createArray(caRules.definitions, caRules.defaultCellDefinition, caRules.neighbourRadius);
        }

        inBounds(x: number, y: number): boolean {
            return x >= 0 && y >= 0 && x < this.width && y < this.height;
        }

        private createArray(cellDefinitions: CellDefinition[], defaultCellDefinition: number, neighbourRadius: number): Cell[][] {
            let arr: Cell[][] = new Array(this.width);
            for (let a = 0; a < this.width; a++) {
                arr[a] = new Array(this.height);
                for (let b = 0; b < this.height; b++) {
                    arr[a][b] = new Cell(defaultCellDefinition, true);
                }
            }

            for (let a = 0; a < this.width; a++) {
                for (let b = 0; b < this.height; b++) {
                    arr[a][b].neighbours = this.getNeighbours(a, b, neighbourRadius, cellDefinitions, arr);
                }
            }
            return arr;
        }



        draw(cScreen: HTMLCanvasElement, ctx: CanvasRenderingContext2D, showGrid: boolean, ignoreDirty = false) {

            let cellWidth = Math.round(cScreen.width / this.width);
            let cellHeight = Math.round(cScreen.height / this.height);

            ctx.beginPath();

            if (showGrid)
                this.drawGrid(cScreen, ctx, cellWidth, cellHeight);

            this.drawCells(cScreen, ctx, cellWidth, cellHeight, showGrid, ignoreDirty);

        }

        private drawGrid(cScreen: HTMLCanvasElement, ctx: CanvasRenderingContext2D, cellWidth: number, cellHeight: number) {
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 1;
            for (let i = 0; i <= cScreen.width; i += cellWidth) {
                ctx.moveTo(i + 0.5, 0 + 0.5);
                ctx.lineTo(i + 0.5, cScreen.height + 0.5);
            }

            for (let i = 0; i <= cScreen.height; i += cellHeight) {
                ctx.moveTo(0 + 0.5, i + 0.5);
                ctx.lineTo(cScreen.width + 0.5, i + 0.5);
            }
            ctx.stroke();
        }

        private drawCells(cScreen: HTMLCanvasElement, ctx: CanvasRenderingContext2D, cellWidth: number, cellHeight: number, showGrid: boolean, ignoreDirty = false) {
            let padding = showGrid ? 1 : 0;

            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    let cell = this.board[x][y];

                    let def = this.caRules.definitions[cell.definition];
                    if ((ignoreDirty || cell.dirty)) {
                        def.draw(ctx, ~~(x * cellWidth) + padding, ~~(y * cellHeight) + padding, ~~(cellWidth - padding), ~~(cellHeight - padding));
                    }
                }
            }
        }

        private setCell(cX: number, cY: number, def: number) {
            if (this.inBounds(cX, cY)) {

                let oldCell = this.board[cX][cY];
                let oldDef = oldCell.definition;
                let dirty = oldCell.dirty || oldDef != def;

                let newCell = new Cell(def, dirty);

                newCell.definition = def;
                this.updateNeighbours(cX, cY, oldCell, newCell, this.caRules.neighbourRadius, this.board);

                oldCell.definition = def;
                oldCell.dirty = dirty;

            }
        }

        private getNeighbours(cX: number, cY: number, radius: number, cellDefinitions: CellDefinition[], arr: Cell[][]) {
            let neighbours = new Array(this.caRules.neighbourRadius);
            for (let r = 0; r <= this.caRules.neighbourRadius; r++) {
                neighbours[r] = new Array(cellDefinitions.length);
                for (let d = 0; d < cellDefinitions.length; d++) {
                    neighbours[r][d] = 0;
                }
            }

            let minX = Math.max(cX - radius, 0);
            let maxX = Math.min(cX + radius, this.width - 1);

            let minY = Math.max(cY - radius, 0);
            let maxY = Math.min(cY + radius, this.height - 1);

            if (this.caRules.neighbourMode == "moore") {
                for (let j = minY; j <= maxY; j++) {
                    for (let i = minX; i <= maxX; i++) {
                        if (i != cX || j != cY) {
                            let curRad = Math.max(Math.abs(i - cX), Math.abs(j - cY));

                            let nCell = arr[i][j];
                            let nDefIdx = nCell.definition;
                            neighbours[curRad][nDefIdx] += 1;
                        }
                    }
                }
            } else if (this.caRules.neighbourMode == "vonneuman") {
                for (let i = minX; i <= maxX; i++) {
                    if (i != cX) {
                        let curRad = Math.abs(i - cX);
                        let nCell = arr[i][cY];
                        let nDefIdx = nCell.definition;
                        neighbours[curRad][nDefIdx] += 1;
                    }
                }

                for (let j = minY; j <= maxY; j++) {
                    if (j != cY) {
                        let curRad = Math.abs(j - cY);
                        let nCell = arr[cX][j];
                        let nDefIdx = nCell.definition;
                        neighbours[curRad][nDefIdx] += 1;
                    }
                }
            }

            return neighbours;
        }

        private updateNeighbours(cX: number, cY: number, cell: Cell, newCell: Cell, radius: number, board: Cell[][]) {
            if (board === undefined)
                board = this.board2;

            let minX = Math.max(cX - radius, 0);
            let maxX = Math.min(cX + radius, this.width - 1);

            let minY = Math.max(cY - radius, 0);
            let maxY = Math.min(cY + radius, this.height - 1);

            let oldDefIdx = cell.definition;
            let oldDef = this.caRules.definitions[oldDefIdx];

            let newDefIdx = newCell.definition;
            let newDef = this.caRules.definitions[newDefIdx];

            if (this.caRules.neighbourMode == "moore") {
                for (let j = minY; j <= maxY; j++) {
                    for (let i = minX; i <= maxX; i++) {
                        if (i != cX || j != cY) {

                            let curRad = Math.max(Math.abs(i - cX), Math.abs(j - cY));

                            let nCell = board[i][j];
                            let neighboursOfRad = nCell.neighbours[curRad];

                            neighboursOfRad[oldDefIdx] -= 1;
                            neighboursOfRad[newDefIdx] += 1;
                        }
                    }
                }
            } else if (this.caRules.neighbourMode == "vonneuman") {
                for (let i = minX; i <= maxX; i++) {
                    if (i != cX) {
                        let curRad = Math.abs(i - cX);
                        let nCell = board[i][cY];
                        let neighboursOfRad = nCell.neighbours[curRad];

                        neighboursOfRad[oldDefIdx] -= 1;
                        neighboursOfRad[newDefIdx] += 1;
                    }
                }

                for (let j = minY; j <= maxY; j++) {
                    if (j != cY) {
                        let curRad = Math.abs(j - cY);
                        let nCell = board[cX][j];
                        let neighboursOfRad = nCell.neighbours[curRad];

                        neighboursOfRad[oldDefIdx] -= 1;
                        neighboursOfRad[newDefIdx] += 1;
                    }
                }
            }
        }



        update() {

            this.copyNeighboursToNextState();

            let h = this.height;
            let w = this.width;
            let board = this.board;
            let board2 = this.board2;
            for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    let currentCell = board[x][y];
                    let nextCell = board2[x][y];
                    nextCell.dirty = false;
                    this.caRules.onUpdate(x, y, currentCell, nextCell);

                    if (nextCell.definition != currentCell.definition) {
                        nextCell.dirty = true;
                        this.updateNeighbours(x, y, currentCell, nextCell, this.caRules.neighbourRadius, this.board2);
                    }
                }
            }
            
            // swap boards
            let tmp = this.board2;
            this.board2 = this.board;
            this.board = tmp;

            this.generation++;
        }

        private copyNeighboursToNextState() {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    let neighbours = this.board[x][y].neighbours;
                    let nextCell = this.board2[x][y];
                    
                    // don't slice, otherwise garbage collection is shitting bricks 
                    for (let r = 0; r < neighbours.length; r++) {
                        let len = neighbours[r].length;
                        for (let i = 0; i < len; i++) {
                            nextCell.neighbours[r][i] = neighbours[r][i];
                        }
                    }

                }
            }
        }



        randomize(padding: number = 0) {
            this.generation = 0;
            for (let y = padding; y < this.height - padding; y++) {
                for (let x = padding; x < this.width - padding; x++) {
                    this.setCell(x, y, Math.floor(this.rnd.next() * this.caRules.definitions.length));
                }
            }
        }



        clear() {
            this.generation = 0;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.setCell(x, y, this.caRules.defaultCellDefinition);
                }
            }
        }
    }
}

namespace Noise {
    /// <summary>
    /// A class that generates pseudo random values using the diamond square algoritm.
    /// The class lazy loads chunks based on the requested coordinates. Adjacent chunks
    /// are generated seamlessy by copying the borders of the already loaded chunks as initial
    /// seed for the current chunk.
    /// </summary>
    /// <param name='size'>The chunk size (in 2^x +1) </param>
    /// <param name='rougness'>The roughness parameter of the algorithm, [0f, 1f]</param>
    export class DiamondSquare {

        private size: number;
        private roughness: number;
        private loadedValues: Object = {};

        constructor(size: number, private rnd: Sampling.Random, roughness: number = 1) {
            this.size = this.getNextMultipleOf2(size);

            this.roughness = roughness;
        }

        private getNextMultipleOf2(size: number): number {
            let val = Math.log(size - 1) / Math.LN2;
            if (val != Math.round(val)) {
                return (2 ** Math.ceil(val)) + 1;
            }
            else
                return size;
        }
        /// <summary>
        /// Returns a value generated from the diamond square algorithm at given coordinates
        /// </summary>
        getValue(x: number, y: number) {

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

    

        /// <summary>
        /// Creates an initial array for a chunk
        /// </summary>
        /// <param name='loadedValues'>The chunks already loaded</param>
        /// <param name='srcX'>The x coordinate of the chunk</param>
        /// <param name='srcY'>The y coordinate of the chunk</param>
        /// <returns>An initial array for a new chunk</returns>
        private getInitialArray(loadedValues: Object, srcX: number, srcY: number) {

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
        }


        /// <summary>
        /// Applies the diamond square algorithm on the given initial array for a chunk
        /// </summary>
        /// <param name='initialArray'>The initial array for the chunk to apply the algorithm on</param>
        /// <param name='loadedValues'>The loaded chunks</param>
        /// <param name='srcX'>The x coordinate of the chunk</param>
        /// <param name='srcY'>The y coordinate of the chunk</param>
        /// <returns>The filled in array</returns>
        private generateArray(initialArray: number[][], loadedValues: Object, srcX: number, srcY: number, roughness: number): number[][] {
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
                            values[destX][destY] = DiamondSquare.average(values[i][j],
                                values[i + length - 1][j],
                                values[i][j + length - 1],
                                values[i + length - 1][j + length - 1])
                                + randomParam;

                            // clip the values if they fall outside [0,1]
                            if (values[destX][destY] < 0) values[destX][destY] = 0;
                            if (values[destX][destY] > 1) values[destX][destY] = 1;

                            //console.log("DS values[" + destX + "][" + destY + "] = " + values[destX][destY]);
                        }
                    }
                }

                // done the diamond step
                // perform square step
                var halfsize = Math.floor(length / 2);

                for (var j = 0; j <= this.size - 1; j += halfsize) //length - 1)
                {
                    for (var i = (Math.floor(j / halfsize) % 2 === 0 ? halfsize : 0); i <= this.size - 1; i += length - 1) {
                        // for each square, determine midpoint of surrounding 4 diamonds
                        this.doDiamondOnMidpoint(values, i, j, length, appliedRoughness, loadedValues, srcX, srcY);
                    }
                }

                appliedRoughness = appliedRoughness / 2; //* (1 - ((roughness * (Math.pow(2, -roughness)))));

                length = Math.floor(((length - 1) / 2) + 1);
            }

            return values;
        }

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
        private doDiamondOnMidpoint(values: number[][], midpointX: number, midpointY: number, length: number, weight: number, loadedValues, srcX: number, srcY: number) {
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
                if (value < 0) value = 0;
                if (value > 1) value = 1;

                values[midpointX][midpointY] = value;
            }
        }

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
        private getValueRaw(loadedValues: number[][], x: number, y: number, curvalues: number[][], srcX: number, srcY: number): number {
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
        }
    
        /// <summary>
        /// Returns the average of the given points. If any of the points are undefined,
        /// they will be skipped
        /// </summary>
        /// <param name='p1'>The 1st value</param>
        /// <param name='p2'>The 2nd value</param>
        /// <param name='p3'>The 3rd value</param>
        /// <param name='p4'>The 4th value</param>
        /// <returns>An average of the given values</returns>
        private static average(p1: number, p2: number, p3: number, p4: number): number {
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
        }
    }

}


namespace Sampling {

    // the size in pixels of the radius of the sample
    const SAMPLE_CIRCLE_RADIUS: number = 3;
    // Implementation based on http://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
    export class PoissonDisc {

        samples: Sample[] = [];

        private _isDone: boolean;
        get isDone(): boolean { return this._isDone; }

        private width: number;
        private height: number;

        private minDistance: number;
        private nrSamplingAttempts: number;

        private backgroundGrid: Sample[][] = [];
        private nrCols: number;
        private nrRows: number;
        private cellSize: number;

        private activeList: Sample[] = [];

        private canAddSample: (x: number, y: number) => boolean;


        private deepestSample: Sample = null;


        public getDeepestSample(): Sample {
            return this.deepestSample;
        }

        public drawLinks: boolean = true;
        public drawLinkColor: string = "white";


        public constructor(width: number, height: number, minDistance: number, nrSamplingAttempts: number, private rnd: Sampling.Random, canAddSample: (x: number, y: number) => boolean) {
            this.width = width;
            this.height = height;
            this.minDistance = minDistance;
            this.nrSamplingAttempts = nrSamplingAttempts;
            this.canAddSample = canAddSample;
            
            // step 0: initialize a n-dimensional background grid
            this.initBackgroundGrid();
        }

        /**
         * Initializes the background grid and determines the cell size and how many rows & cols the grid has
         */
        private initBackgroundGrid() {
            // ensure that there will only be at most 1 sample per cell in the background grid
            this.cellSize = this.minDistance;// / Math.sqrt(2));

            // determine the nr of cols & rows in the background grid
            this.nrCols = Math.ceil(this.width / this.cellSize);
            this.nrRows = Math.ceil(this.height / this.cellSize);

            for (var i: number = 0; i < this.nrCols; i++) {
                this.backgroundGrid[i] = [];
                for (var j: number = 0; j < this.nrRows; j++) {
                    this.backgroundGrid[i][j] = null;
                }
            }
        }

        public addInitialSample(x: number, y: number) {
            var initSample: Sample = new Sample(x, y);
            this.addSample(initSample);

            this.deepestSample = initSample;
        }
        /**
         * Adds a valid sample to the various constructs of the algorithm
         */
        private addSample(s: Sample) {
            var xIdx = Math.floor(s.x / this.width * this.nrCols);
            var yIdx = Math.floor(s.y / this.height * this.nrRows);

            this.backgroundGrid[xIdx][yIdx] = s;
            this.activeList.push(s);
            this.samples.push(s);

            s.drawTo(Main.Canvases.ctxOverlay, true);
        }

        /**
         * Chooses a sample from the active list and tries to find a random sample between its r and 2r radius
         * that is not too close to other samples, checked by looking nearby samples up in the background grid
         * If no sample could be determined within <nrSamples> then stop looking and return false. Also remove the
         * sample from the active list because it will never have any suitable samples to expand upon.
         * 
         * @returns true if a sample was able to be found, otherwise false
         */
        step(): boolean {
            if (this.activeList.length <= 0) {
                this._isDone = true;
                return true;
            }

            // choose a random index from it
            var idx: number = Math.floor(this.rnd.next() * this.activeList.length);
            var s: Sample = this.activeList[idx];
            
            // generate up to nrSamples points uniformly from the spherical annullus between radius r and 2r (MIN_DISTANCE and 2 * MIN_DISTANCE)
            // around the chosen sample x_i
            
            // choose a point by creating a vector to the inner boundary
            // and multiplying it by a random value between [1-2]
            var initvX: number = this.minDistance;
            var initvY: number = 0;

            var k: number = 0;
            var found: boolean = false;
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
                var x: number = s.x + length * vX;
                var y: number = s.y + length * vY;

                var xIdx = Math.floor(x / this.width * this.nrCols);
                var yIdx = Math.floor(y / this.height * this.nrRows);

                if (x >= 0 && y >= 0 && x < this.width && y < this.height
                    && this.backgroundGrid[xIdx][yIdx] == null
                    && !this.containsSampleInBackgroundGrid(x, y) && this.canAddSample(x, y)) {
                    // adequately far from existing samples
                
                    var newSample: Sample = new Sample(x, y);
                    newSample.previousSample = s;
                    newSample.depth = s.depth + 1;

                    if (this.drawLinks) {
                        Main.Canvases.ctxOverlay.beginPath();
                        Main.Canvases.ctxOverlay.strokeStyle = this.drawLinkColor;
                        Main.Canvases.ctxOverlay.lineWidth = 2;
                        Main.Canvases.ctxOverlay.moveTo(s.x, s.y);
                        let xc = (s.x + newSample.x) / 2;
                        let yc = (s.y + newSample.y) / 2;
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
        }

        /**
         * Checks if there is a sample around the x,y sample that's closer than the minimum radius
         * using the background grid
         * 
         * @returns true if there is a sample within the minimum radius, otherwise false
         */
        containsSampleInBackgroundGrid(x: number, y: number): boolean {
            var xIdx = (x / this.width * this.nrCols);
            var yIdx = (y / this.height * this.nrRows);

            // determine the bounding box of the radius
            var lboundX = (x - this.minDistance) / this.width * this.nrCols;
            var lboundY = (y - this.minDistance) / this.height * this.nrRows;
            var uboundX = Math.ceil((x + this.minDistance) / this.width * this.nrCols);
            var uboundY = Math.ceil((y + this.minDistance) / this.height * this.nrRows);
            // make sure i,j falls within bounds
            if (lboundX < 0) lboundX = 0;
            if (lboundY < 0) lboundY = 0;
            if (uboundX >= this.nrCols) uboundX = this.nrCols - 1;
            if (uboundY >= this.nrRows) uboundY = this.nrRows - 1;

            for (var i: number = lboundX; i <= uboundX; i++) {
                for (var j: number = lboundY; j <= uboundY; j++) {
                    let sample = this.backgroundGrid[Math.floor(i)][Math.floor(j)];
                    // check if the cell contains a sample and if the distance is smaller than the minimum distance
                    if (sample != null &&
                        sample.distanceTo(x, y) < this.minDistance) {

                        return true; // short circuit if you don't need to draw the cells around the given x,y
                    }
                }
            }

            return false;
        }

    }

    export class Sample {
        x: number;
        y: number;

        previousSample: Sample = null;
        depth: number;

        public constructor(x: number, y: number) {
            this.x = Math.floor(x);
            this.y = Math.floor(y);
            this.depth = 0;
        }

        drawTo(ctx: CanvasRenderingContext2D, isActive: boolean) {
            ctx.beginPath();
            if (isActive)
                ctx.fillStyle = "#CCC";
            else
                ctx.fillStyle = "black";

            ctx.arc(this.x, this.y, SAMPLE_CIRCLE_RADIUS, 0, 2 * Math.PI, false);

            ctx.fill();
            ctx.stroke();
        }

        distanceTo(x: number, y: number): number {
            return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y));
        }
    }


    export class Random {
        private seed: number;
        constructor(seed?: number) {
            if (typeof seed === "undefined")
                seed = new Date().getTime();

            this.seed = seed;
        }

        next(): number {
            // this is in no way uniformly distributed, so it's really a bad rng, but it's fast enough
            // and random enough
            let x = Math.sin(this.seed++) * 10000;
            return x - Math.floor(x);
        }

        nextBetween(min: number, max: number): number {
            return min + this.next() * (max - min);
        }
    }

}

