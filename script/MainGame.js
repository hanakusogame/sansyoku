"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var waku = new g.Sprite({
            scene: scene,
            x: 0, y: 0,
            src: scene.assets["waku"]
        });
        _this.append(waku);
        var ballH = 8;
        var ballW = 10;
        var ballSize = 42;
        var base = new g.E({
            scene: scene,
            x: 12, y: 12,
            width: ballW * ballSize,
            height: ballH * ballSize,
            touchable: true
        });
        _this.append(base);
        //ボールの作成
        var balls = [];
        for (var y = 0; y < ballH; y++) {
            balls[y] = [];
            for (var x = 0; x < ballW; x++) {
                var ball = new g.FrameSprite({
                    scene: scene,
                    x: x * ballSize,
                    y: y * ballSize,
                    width: ballSize,
                    height: ballSize,
                    src: scene.assets["ball"],
                    frames: [0, 1, 2, 6, 7, 8],
                    tag: -1
                });
                base.append(ball);
                balls[y][x] = ball;
            }
        }
        var selectArea = new g.FilledRect({
            scene: scene,
            width: 0,
            height: 0,
            cssColor: "yellow",
            opacity: 0.1
        });
        base.append(selectArea);
        //選択範囲を囲う線
        var lines = [];
        for (var i = 0; i < 4; i++) {
            var line = new g.FilledRect({
                scene: scene,
                width: 2,
                height: 2,
                cssColor: "white"
            });
            lines.push(line);
            base.append(line);
        }
        //何組で消したかの表示の作成
        var glyph = JSON.parse(scene.assets["glyph72"].data);
        var numFontB = new g.BitmapFont({
            src: scene.assets["number_b"],
            map: glyph.map,
            defaultGlyphWidth: 72,
            defaultGlyphHeight: 80
        });
        var labelCombo = new g.Label({
            scene: scene,
            font: numFontB,
            fontSize: 50,
            text: "1",
            x: 470,
            y: 125
        });
        _this.append(labelCombo);
        var sprCombo = new g.Sprite({
            scene: scene,
            src: scene.assets["combo"],
            height: 40,
            x: 50,
            y: 10
        });
        labelCombo.append(sprCombo);
        //全消し表示用
        var sprAll = new g.Sprite({
            scene: scene,
            src: scene.assets["combo"],
            height: 40,
            srcY: 80,
            x: 490,
            y: 190
        });
        _this.append(sprAll);
        //シャッフルボタン
        var shuffleCnt = 0;
        var btnAdd = new g.FrameSprite({
            scene: scene,
            src: scene.assets["add"],
            x: 450,
            y: 220,
            width: 160,
            height: 80,
            frames: [0, 1],
            touchable: true
        });
        _this.append(btnAdd);
        btnAdd.pointDown.add(function () {
            if (!scene.isStart)
                return;
            //setBalls();
            shuffle();
            btnAdd.frameNumber = 1;
            btnAdd.modified();
            scene.playSound("se_move");
            shuffleCnt--;
            labelShuffle.text = "*" + shuffleCnt;
            labelShuffle.invalidate();
        });
        btnAdd.pointUp.add(function () {
            btnAdd.frameNumber = 0;
            btnAdd.modified();
            if (shuffleCnt === 0) {
                btnAdd.hide();
            }
        });
        //シャッフル回数表示ラベル
        var labelShuffle = new g.Label({
            scene: scene,
            font: scene.numFont,
            fontSize: 32,
            text: "*2",
            x: 100, y: 60
        });
        btnAdd.append(labelShuffle);
        var px = 0;
        var py = 0;
        //押した
        base.pointDown.add(function (e) {
            if (!scene.isStart)
                return;
            px = e.point.x;
            py = e.point.y;
            lines.forEach(function (line) {
                line.show();
                line.resizeTo(2, 2);
                line.moveTo(px, py);
                line.modified();
            });
            selectArea.show();
            selectArea.moveTo(px, py);
            selectArea.resizeTo(0, 0);
            selectArea.modified();
        });
        //選択中のボールの取得と表示
        var arrball = [];
        var selectBall = function (w, h) {
            var px1 = Math.max(Math.floor(((w >= 0) ? px : px + w) / ballSize), 0);
            var py1 = Math.max(Math.floor(((h >= 0) ? py : py + h) / ballSize), 0);
            var px2 = Math.min(Math.floor(((w >= 0) ? px + w : px) / ballSize), ballW - 1);
            var py2 = Math.min(Math.floor(((h >= 0) ? py + h : py) / ballSize), ballH - 1);
            arrball.forEach(function (e) {
                if (e.frameNumber !== e.tag) {
                    e.frameNumber = e.tag;
                    e.modified();
                }
            });
            arrball = [];
            for (var y = py1; y <= py2; y++) {
                for (var x = px1; x <= px2; x++) {
                    var ball = balls[y][x];
                    if (ball.tag !== -1) {
                        arrball.push(ball);
                    }
                }
            }
            arrball.forEach(function (e) {
                if (e.frameNumber !== e.tag + 3) {
                    e.frameNumber = e.tag + 3;
                    e.modified();
                }
            });
        };
        //選択範囲の表示
        var showArea = function (w, h) {
            var px1 = (w >= 0) ? px : px + w;
            var py1 = (h >= 0) ? py : py + h;
            var ww = Math.abs(w);
            var hh = Math.abs(h);
            selectArea.resizeTo(w, h);
            lines[0].width = ww + 2;
            lines[0].moveTo(px1, py1);
            lines[1].height = hh + 2;
            lines[1].moveTo(px1, py1);
            lines[2].width = ww + 2;
            lines[2].moveTo(px1, py1 + hh);
            lines[3].height = hh + 2;
            lines[3].moveTo(px1 + ww, py1);
            for (var i = 0; i < 4; i++) {
                lines[i].modified();
            }
        };
        //ドラッグ
        base.pointMove.add(function (e) {
            if (!scene.isStart)
                return;
            var w = e.startDelta.x;
            var h = e.startDelta.y;
            showArea(w, h);
            selectBall(w, h);
            selectArea.modified();
        });
        var tweenBk;
        //離した
        base.pointUp.add(function (e) {
            if (!scene.isStart)
                return;
            var w = e.startDelta.x;
            var h = e.startDelta.y;
            showArea(w, h);
            selectBall(w, h);
            var arrCnt = [0, 0, 0];
            arrball.forEach(function (ball) {
                arrCnt[ball.tag]++;
            });
            //消す判定
            var flg = false;
            if (arrCnt[0] > 0 && arrCnt[0] <= 3) {
                if (arrCnt.filter(function (x, i, self) { return self.indexOf(x) === i; }).length === 1) {
                    flg = true;
                }
            }
            if (flg) {
                //消す処理
                arrball.forEach(function (ball) {
                    ball.tag = -1;
                    timeline.create(ball).moveBy(0, -30, 120, tl.Easing.easeOutCirc)
                        .moveBy(0.0, 30, 120, tl.Easing.easeInCirc)
                        .every(function (a, b) {
                        ball.opacity = (b * 2) % 1;
                    }, 400).call(function () { return ball.hide(); });
                });
                scene.addScore(arrCnt[0] * 500 + (arrCnt[0] - 1) * 500);
                ballCnt -= (arrCnt[0] * 3);
                labelCombo.text = "" + arrCnt[0];
                labelCombo.invalidate();
                labelCombo.show();
                timeline.remove(tweenBk);
                tweenBk = timeline.create().wait(2000).call(function () {
                    labelCombo.hide();
                });
                //全消し
                if (ballCnt === 0) {
                    sprAll.show();
                    scene.addScore(2000);
                    timeline.create().wait(1000).call(function () {
                        setBalls();
                    }).wait(3000).call(function () {
                        sprAll.hide();
                    });
                    scene.playSound("se_clear");
                }
                else {
                    scene.playSound("se_move");
                }
            }
            else {
                arrball.forEach(function (ball) {
                    ball.frameNumber = ball.tag;
                    ball.modified();
                });
                scene.playSound("se_miss");
            }
            lines.forEach(function (line) { return line.hide(); });
            selectArea.hide();
        });
        var setBalls = function () {
            //ボールを２０個ずつになるようにセットする。
            var list = [];
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < (60 - ballCnt) / 3; j++) {
                    list.push(i);
                }
            }
            var blankNum = (ballW * ballH) - ballCnt - list.length;
            for (var i = 0; i < blankNum; i++) {
                list.push(-1);
            }
            //シャッフル
            for (var i = list.length - 1; i > 0; i--) {
                var r = scene.random.get(0, i);
                var tmp = list[i];
                list[i] = list[r];
                list[r] = tmp;
            }
            var cnt = 0;
            for (var y = 0; y < ballH; y++) {
                for (var x = 0; x < ballW; x++) {
                    var ball = balls[y][x];
                    if (ball.tag === -1) {
                        var num = list[cnt];
                        ball.tag = num;
                        if (num === -1) {
                            ball.hide();
                        }
                        else {
                            ball.show();
                            ball.frameNumber = num;
                            ball.opacity = 1;
                            ball.scale(0);
                            ball.modified();
                            timeline.create(ball).scaleTo(1.4, 1.4, 200).scaleTo(1.0, 1.0, 100);
                        }
                        ball.modified();
                        cnt++;
                    }
                }
            }
            ballCnt = 60;
        };
        //シャッフル
        var shuffle = function () {
            var list = Array.prototype.concat.apply([], balls); //一次元化
            //シャッフル
            for (var i = list.length - 1; i > 0; i--) {
                var r = scene.random.get(0, i);
                var tmp = list[i];
                list[i] = list[r];
                list[r] = tmp;
            }
            var cnt = 0;
            for (var y = 0; y < ballH; y++) {
                for (var x = 0; x < ballW; x++) {
                    balls[y][x] = list[cnt];
                    base.append(list[cnt]);
                    timeline.create(list[cnt]).moveTo(x * ballSize, y * ballSize, 500);
                    cnt++;
                }
            }
        };
        var isStop = false;
        var ballCnt = 60;
        //リセット
        _this.reset = function () {
            labelCombo.hide();
            sprAll.hide();
            btnAdd.show();
            shuffleCnt = 2;
            labelShuffle.text = "*" + shuffleCnt;
            labelShuffle.invalidate();
            ballCnt = 0;
            for (var y = 0; y < ballH; y++) {
                for (var x = 0; x < ballW; x++) {
                    var ball = balls[y][x];
                    ball.tag = -1;
                    ball.hide();
                }
            }
            lines.forEach(function (line) { return line.hide(); });
            selectArea.hide();
            setBalls();
            isStop = false;
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
