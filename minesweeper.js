var minesArr = [],
ceilArr = [],
rows = 18,
cols = 10,
frameSize = 64,
width, height,
front,
loader,
canvas,
timestart,
timeLoop,
stage,
stats,
imgTiles,
container,
sprites,
tileScale = 1;

var levelsObj = {
    l11: 'mines-tiles__.png',
    l12: 'mines-tiles__m.png',
    l13: 'mines-tiles__h.png',
    l21: 'mines-tiles.ice.png',
    l22: 'mines-tiles.ice_m.png',
    l23: 'mines-tiles.ice_h.png',
    l31: 'mines-tiles.win.png',
    l32: 'mines-tiles.win_m.png',
    l33: 'mines-tiles.win_h.png',
    l41: 'tiles.dices.png',
    l42: 'tiles.dices_m.png',
    l43: 'tiles.dices_h.png',
    l51: 'tiles.bin.png',
    l52: 'tiles.bin_m.png',
    l53: 'tiles.bin_h.png',
    l61: 'tiles.none.png',
    l62: 'tiles.none_m.png',
    l63: 'tiles.none_h.png'
}

var levelSizes = {
    64: {
        width:15, 
        height:10
    },
    48: {
        width:20, 
        height:13
    },
    32: {
        width:30,
        height:20
    }
}


var HUD = {
    minesLeft: 0,
    uncoveredLeft: 0,
    time:0
}

var Ceil = function(_x, _y){
    this.x = _x;
    this.y = _y;
    this.cover = true; 
    this.neighbors = 0;
    this.frameW = 0;
    this.frameH = 0;
    this.isBomb = false;
    this.marked = false;
    this.graphics = null;
    this.setBomb = function(){
        this.isBomb = true;
    };
    this.setNeighbor = function(){
        this.neighbors++;  
    };
    
    this.getNeighbors = function(){
        return this.neighbors;
    }
    this.draw = function(_sprites, _parent){
        var _this = this;
        var bmpSeq = new BitmapAnimation(_sprites);
        bmpSeq.scaleX = bmpSeq.scaleY = tileScale;
        bmpSeq.regX = 0;
        bmpSeq.regY = 0;
        bmpSeq.x = this.x * _sprites._frameWidth * tileScale;
        bmpSeq.y = this.y * _sprites._frameHeight * tileScale;
        this.frameW = _sprites._frameWidth * tileScale;
        this.frameH = _sprites._frameHeight * tileScale;
        bmpSeq.gotoAndStop('empty');
        bmpSeq.mouseEnabled = true;
        bmpSeq.onPress = function(mouseEvent) {
            _this.click(mouseEvent);
        }
        this.graphics = bmpSeq;
        _parent.addChild(bmpSeq);
    }
    this.uncover = function(){
        if (!this.isBomb) {
            if (this.getNeighbors() == 0) {
                showCloseEmpty(this.graphics.x/this.frameW, this.graphics.y/this.frameH);
            } else {
                this.graphics.gotoAndStop("n"+this.getNeighbors());
                this.cover = false;
                HUD.uncoveredLeft--;
            }
        } else {
            this.graphics.gotoAndStop('bombup');
            stage.update();
            showAll();
        }
    }
    this.setMark = function(){
        if (this.marked == false) {
            this.marked = true;
            //this.cover = false;
            this.graphics.gotoAndStop("bomb");
            HUD.minesLeft--;
            drawStats(0);
            if (HUD.minesLeft == 0) {
                checkUnmarked();
            }
    
        } else {
            this.marked = false;
            //this.cover = true;
            this.graphics.gotoAndStop("empty");
            HUD.minesLeft++;
        }
    }
    this.click = function(mouseEvent){
        var mouseTarget = stage.getObjectUnderPoint(stage.mouseX, stage.mouseY);
        var _this = ceilArr[mouseTarget.x/this.frameW][mouseTarget.y/this.frameH];
        
        if (_this.cover == true) {
            if (mouseEvent.nativeEvent.button == 0) {
                _this.uncover();
            } else if (mouseEvent.nativeEvent.button == 2) {
                if (this.cover == true) {
                    this.setMark();
                }
            }
        } else {
            var i = mouseTarget.x/this.frameW;
            var j = mouseTarget.y/this.frameH;
            var _a = [];
            var _b = 0;
            var _n = 0;
            _n = ceilArr[i][j].getNeighbors();
            
            for (var ii=i-1; ii<=i+1; ii++) {
                for (var jj=j-1; jj<=j+1; jj++) {
                    if (checkBounds(ii, jj)) {
                        if (ceilArr[ii][jj].marked == true) {
                            _b++;
                        }
                        if (ceilArr[ii][jj].marked == false && ceilArr[ii][jj].cover == true) {
                            _a.push([ii, jj]);
                            ceilArr[ii][jj].graphics.gotoAndStop('pressed');
                        }
                    }
                }
            } 
            if (_a.length > 0) {
                mouseEvent.onMouseUp = function(mouseEvent) {
                    clearHint(_a, _b, _n);
                }
            }    
        }
        stage.update();
    }
    
}

$(document).ready(function() {
       
    stats = $('#stats');
    document.oncontextmenu = function() {
        return false;
    };
})

$(window).load(function(){  
    front = $('#front');
    loader = $('#loader');
    var _mTop = ($(document).height() - $(front).height())/2;
    var _lLeft = ($(document).width() - $(loader).width())/2;
    $(loader).css('left', _lLeft+'px');
    $(front).css('marginTop', _mTop+'px');
    $('#difficulty div').click(function(){
        $(this).parent().hide();
        var _l = $('#difficulty div').index(this) || 0;
        chooseType(_l);
    });
});

var chooseType = function(_skill){
    $('#buttons').show();
    $("#buttons div").hover(
        function () {
            $(this).append($("<div id='hover'></div>"));
        }, 
        function () {
            $(this).find("#hover").remove();
        }
        );
            
    $("#buttons div").click(function(){
        $(front).remove();
        $(loader).show();
        var _level_type = $(this).attr('id').substr(3) || 1;
        prepareLevels(_skill, _level_type);
    });            
}

var prepareLevels = function(_skill, _lvl){
    frameSize = 64 - (16 * _skill);
    
    rows = levelSizes[frameSize].width;
    cols = levelSizes[frameSize].height;
    
    imgTiles = new Image();
    imgTiles.src = 'assets/' + levelsObj['l'+_lvl+''+(_skill+1)];
    imgTiles.onload = initApp;
}


var initApp = function(){
    $(loader).hide();
    $(stats).show();
    
    width = $(document).width();
    height = $(document).height();
    canvas = document.getElementById("canvas");
    canvas.width = width;
    canvas.height = height;
    stage = new Stage(canvas);
    container = new Container();
    stage.addChild(container);
    
    sprites = new SpriteSheet({
        images: [imgTiles], 
        frames: {
            width: frameSize, 
            height:frameSize
        }, 
        animations: {
            empty:0, 
            questionTag:1, 
            bomb:2,
            bombup:3,
            n1:4,
            n2:5,
            n3:6,
            n4:7,
            n5:8,
            n6:9,
            n7:10,
            n8:11,
            pressed:12
        }
    });
    startGame();
}
    
 
var startGame = function(){
    timeStart = new Date().getTime();
    for (var i = 0; i < rows; i++) {
        minesArr[i] = [];
        ceilArr[i] = [];
        for (var j = 0; j < cols; j++) {
            minesArr[i][j] = 0;
        }
    }

    var minesCounter = ~~(rows * cols * 0.16);//12 - 20%
    HUD.minesLeft = minesCounter;
    HUD.uncoveredLeft = (rows * cols) - minesCounter;
    timeLoop = setInterval(drawStats, 100);

    while (minesCounter > 0) {
        i = ~~(Math.random()*rows);
        j = ~~(Math.random()*cols);
        if (minesArr[i][j] == 0) {
            minesArr[i][j] = 1;
            minesCounter--;
        }
    }
    container.removeAllChildren();
    
    for (i = 0; i < rows; i++) {
        for (j = 0; j < cols; j++) {
            var _ceil = new Ceil(i, j);
            ceilArr[i][j] = _ceil;
            if (minesArr[i][j] == 1) {
                _ceil.setBomb();
            }
            _ceil.draw(sprites, container);
        }
    }
    
    for (i = 0; i < rows; i++) {
        for (j = 0; j < cols; j++) {
            if (minesArr[i][j] == 1) {
                for (var ii=i-1; ii<=i+1; ii++) {
                    for (var jj=j-1; jj<=j+1; jj++) {
                        if (checkBounds(ii, jj)) {
                            ceilArr[ii][jj].setNeighbor();
                        }
                    }
                } 
            }
        }
    }
    container.x = canvas.width/2 - (rows * sprites._frameWidth  * tileScale / 2);
    container.y = canvas.height/2 - (cols * sprites._frameWidth  * tileScale / 2);
    stage.update();
} 
 
var checkBounds = function(x, y) {
    return ((0 <= x) && (x < rows) && (0 <= y) && (y < cols));
}
    
var showCloseEmpty = function(x, y){
    if (checkBounds(x, y)) {
        if (ceilArr[x][y].cover == true) {
            if (ceilArr[x][y].getNeighbors() == 0) {
                ceilArr[x][y].graphics.gotoAndStop('pressed');
                ceilArr[x][y].cover = false;
                HUD.uncoveredLeft--;
                showCloseEmpty(x-1,y-1);
                showCloseEmpty(x-1,y);
                showCloseEmpty(x-1,y+1);
                showCloseEmpty(x,y-1);
                showCloseEmpty(x,y+1);
                showCloseEmpty(x+1,y-1);
                showCloseEmpty(x+1,y);
                showCloseEmpty(x+1,y+1);
            } else if (ceilArr[x][y].getNeighbors() > 0) {
                ceilArr[x][y].graphics.gotoAndStop("n"+ceilArr[x][y].getNeighbors());
                ceilArr[x][y].cover = false;
                HUD.uncoveredLeft--;
            }
        }
    }
}


var drawStats = function(){
    if (HUD.minesLeft<0) {
        HUD.minesLeft = 0;
    }
    if (HUD.uncoveredLeft<0) {
        HUD.uncoveredLeft = 0;
    }
    var _time = (new Date().getTime() - timeStart)/1000;
    var _st = "mines left: " + HUD.minesLeft + " | time: " + Math.decimal(_time);
    if (isInteger(Math.decimal(_time))) {
        _st += '.0';
    }
    stats.html(_st);
}

var clearHint = function(_arr, _sum, _nei){
    var l = _arr.length;
    for (var o = 0; o < l; o++) {
        var _this = ceilArr[_arr[o][0]][_arr[o][1]];
        if (_sum ==_nei) {
            if (_this.isBomb) {
                _this.graphics.gotoAndStop('bombup');
                _this.cover = false;
                stage.update();
                showAll();
                return;
            }
            if (_this.getNeighbors()>0) {
                _this.graphics.gotoAndStop("n"+_this.getNeighbors());
                _this.cover = false;
                HUD.uncoveredLeft--;
            } else {
                showCloseEmpty(_arr[o][0],_arr[o][1]);
            }
        } else {
            _this.graphics.gotoAndStop('empty');
        }
    }
    stage.update();
}

var showAll = function(_p){
    var _this;
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            _this = ceilArr[i][j];
            if (_this.cover == true) {
                if (_this.isBomb) {
                    if (_this.graphics.currentFrame != 3) {
                        _this.graphics.gotoAndStop('bomb');
                    } else {}
                } else {
                    if (_this.getNeighbors()>0) {
                        _this.graphics.gotoAndStop("n"+_this.getNeighbors());
                    } else {
                        _this.graphics.gotoAndStop('pressed');
                    }
                }
            }
        }
    }
    stage.update();
    if (_p) {
        endGame(1);
    } else {
        endGame(0);
    }
}

var checkUnmarked = function(){
    var _checked = 0;
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            _this = ceilArr[i][j];
            if (_this.cover == true && _this.marked == false) {
                if (_this.isBomb) {
                    _checked = 1;
                    return;
                }
            }
        }
    }
    if (_checked == 0) {
        showAll(1);
    }
}

var endGame = function(_o){
    clearInterval(timeLoop);
    var _this = $('#final');
    $(_this).css('top', ($(document).height() - $(_this).height())/2);
    $(_this).css('left', ($(document).width() - $(_this).width())/2);
    if (_o == 0) {
        _this.children("#head").html("You lost!");
        _this.children("#sub").html();
    } else {
        _this.children("#head").html("You won!");
        _this.children("#sub").html("Time: " + Math.decimal((new Date().getTime() - timeStart)/1000, 2) + " sec.");
    }
    $('#final').show();
    $('#b_s').click(function(){
        clearInterval(timeLoop);
        _this.unbind();
        _this.hide();
        minesArr = [];
        ceilArr = [];
        startGame();
    });
    
    $('#b_n').click(function(){
        window.location.reload();
    });
}

Math.decimal = function(n, k) {
    if (k === undefined) {
        k = 1;
    }
    var factor = Math.pow(10, k+1);
    n = Math.round(Math.round(n*factor)/10);
    return n/(factor/10);
}

var isInteger = function(x){
    if (x == Math.floor(x))
        return true;
    return false;
}