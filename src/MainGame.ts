import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;
		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const waku = new g.Sprite({
			scene: scene,
			x: 0, y: 0,
			src: scene.assets["waku"]
		});
		this.append(waku);

		const ballH = 8;
		const ballW = 10;
		const ballSize = 42;

		const base = new g.E({
			scene: scene,
			x: 12, y: 12,
			width: ballW * ballSize,
			height: ballH * ballSize,
			touchable: true
		});
		this.append(base);

		//ボールの作成
		const balls: g.FrameSprite[][] = [];
		for (let y = 0; y < ballH; y++) {
			balls[y] = [];
			for (let x = 0; x < ballW; x++) {
				const ball = new g.FrameSprite({
					scene: scene,
					x: x * ballSize,
					y: y * ballSize,
					width: ballSize,
					height: ballSize,
					src: scene.assets["ball"] as g.ImageAsset,
					frames: [0, 1, 2, 6, 7, 8],
					tag: -1
				});
				base.append(ball);
				balls[y][x] = ball;
			}
		}

		const selectArea = new g.FilledRect({
			scene: scene,
			width: 0,
			height: 0,
			cssColor: "yellow",
			opacity: 0.1
		});
		base.append(selectArea);

		//選択範囲を囲う線
		const lines: g.FilledRect[] = [];
		for (let i = 0; i < 4; i++) {
			const line = new g.FilledRect({
				scene: scene,
				width: 2,
				height: 2,
				cssColor: "white"
			});
			lines.push(line);
			base.append(line);
		}

		//何組で消したかの表示の作成
		const glyph = JSON.parse((scene.assets["glyph72"] as g.TextAsset).data);
		const numFontB = new g.BitmapFont({
			src: scene.assets["number_b"],
			map: glyph.map,
			defaultGlyphWidth: 72,
			defaultGlyphHeight: 80
		});

		const labelCombo = new g.Label({
			scene: scene,
			font: numFontB,
			fontSize: 50,
			text: "1",
			x: 470,
			y: 125
		});
		this.append(labelCombo);

		const sprCombo = new g.Sprite({
			scene: scene,
			src: scene.assets["combo"],
			height: 40,
			x: 50,
			y: 10
		});
		labelCombo.append(sprCombo);

		//全消し表示用
		const sprAll = new g.Sprite({
			scene: scene,
			src: scene.assets["combo"],
			height: 40,
			srcY: 80,
			x: 490,
			y: 190
		});
		this.append(sprAll);

		//シャッフルボタン
		let shuffleCnt = 0;
		const btnAdd = new g.FrameSprite({
			scene: scene,
			src: scene.assets["add"] as g.ImageAsset,
			x: 450,
			y: 220,
			width: 160,
			height: 80,
			frames: [0, 1],
			touchable: true
		});
		this.append(btnAdd);

		btnAdd.pointDown.add(() => {
			if (!scene.isStart) return;
			//setBalls();
			shuffle();
			btnAdd.frameNumber = 1;
			btnAdd.modified();
			scene.playSound("se_move");
			shuffleCnt--;
			labelShuffle.text = "*" + shuffleCnt;
			labelShuffle.invalidate();
		});

		btnAdd.pointUp.add(() => {
			btnAdd.frameNumber = 0;
			btnAdd.modified();

			if (shuffleCnt === 0) {
				btnAdd.hide();
			}
		});

		//シャッフル回数表示ラベル
		const labelShuffle = new g.Label({
			scene: scene,
			font: scene.numFont,
			fontSize: 32,
			text: "*2",
			x:100, y : 60
		});
		btnAdd.append(labelShuffle);

		let px = 0;
		let py = 0;

		//押した
		base.pointDown.add(e => {
			if (!scene.isStart) return;
			px = e.point.x;
			py = e.point.y;

			lines.forEach(line => {
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
		let arrball: g.FrameSprite[] = [];
		const selectBall = (w: number, h: number) => {
			const px1 = Math.max(Math.floor(((w >= 0) ? px : px + w) / ballSize), 0);
			const py1 = Math.max(Math.floor(((h >= 0) ? py : py + h) / ballSize), 0);

			const px2 = Math.min(Math.floor(((w >= 0) ? px + w : px) / ballSize), ballW - 1);
			const py2 = Math.min(Math.floor(((h >= 0) ? py + h : py) / ballSize), ballH - 1);

			arrball.forEach(e => {
				if (e.frameNumber !== e.tag) {
					e.frameNumber = e.tag;
					e.modified();
				}
			});
			arrball = [];
			for (let y = py1; y <= py2; y++) {
				for (let x = px1; x <= px2; x++) {
					const ball = balls[y][x];
					if (ball.tag !== -1) {
						arrball.push(ball);
					}
				}
			}
			arrball.forEach(e => {
				if (e.frameNumber !== e.tag + 3) {
					e.frameNumber = e.tag + 3;
					e.modified();
				}
			});
		};

		//選択範囲の表示
		const showArea = (w: number, h: number) => {
			const px1 = (w >= 0) ? px : px + w;
			const py1 = (h >= 0) ? py : py + h;
			const ww = Math.abs(w);
			const hh = Math.abs(h);

			selectArea.resizeTo(w, h);
			lines[0].width = ww + 2;
			lines[0].moveTo(px1, py1);
			lines[1].height = hh + 2;
			lines[1].moveTo(px1, py1);
			lines[2].width = ww + 2;
			lines[2].moveTo(px1, py1 + hh);
			lines[3].height = hh + 2;
			lines[3].moveTo(px1 + ww, py1);
			for (let i = 0; i < 4; i++) {
				lines[i].modified();
			}
		};

		//ドラッグ
		base.pointMove.add(e => {
			if (!scene.isStart) return;

			const w = e.startDelta.x;
			const h = e.startDelta.y;

			showArea(w, h);
			selectBall(w, h);

			selectArea.modified();
		});

		let tweenBk: any;
		//離した
		base.pointUp.add(e => {
			if (!scene.isStart) return;

			const w = e.startDelta.x;
			const h = e.startDelta.y;

			showArea(w, h);
			selectBall(w, h);

			const arrCnt = [0, 0, 0];
			arrball.forEach(ball => {
				arrCnt[ball.tag]++;
			});

			//消す判定
			let flg = false;
			if (arrCnt[0] > 0 && arrCnt[0] <= 3) {
				if (arrCnt.filter((x, i, self) => self.indexOf(x) === i).length === 1) {
					flg = true;
				}
			}

			if (flg) {
				//消す処理
				arrball.forEach(ball => {
					ball.tag = -1;
					timeline.create(ball).moveBy(0, -30, 120, tl.Easing.easeOutCirc)
						.moveBy(0.0, 30, 120, tl.Easing.easeInCirc)
						.every((a: number, b: number) => {
							ball.opacity = (b * 2) % 1;
						}, 400).call(() => ball.hide());
				});
				scene.addScore(arrCnt[0] * 500 + (arrCnt[0] - 1) * 500);
				ballCnt -= (arrCnt[0] * 3);

				labelCombo.text = "" + arrCnt[0];
				labelCombo.invalidate();
				labelCombo.show();
				timeline.remove(tweenBk);
				tweenBk = timeline.create().wait(2000).call(() => {
					labelCombo.hide();
				});

				//全消し
				if (ballCnt === 0) {
					sprAll.show();
					scene.addScore(2000);
					timeline.create().wait(1000).call(() => {
						setBalls();
					}).wait(3000).call(() => {
						sprAll.hide();
					});
					scene.playSound("se_clear");
				} else {
					scene.playSound("se_move");
				}
			} else {
				arrball.forEach(ball => {
					ball.frameNumber = ball.tag;
					ball.modified();
				});
				scene.playSound("se_miss");
			}

			lines.forEach(line => line.hide());
			selectArea.hide();

		});

		const setBalls = () => {
			//ボールを２０個ずつになるようにセットする。

			const list: number[] = [];
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < (60 - ballCnt) / 3; j++) {
					list.push(i);
				}
			}

			const blankNum = (ballW * ballH) - ballCnt - list.length;
			for (let i = 0; i < blankNum; i++) {
				list.push(-1);
			}

			//シャッフル
			for (let i = list.length - 1; i > 0; i--) {
				const r = scene.random.get(0, i);
				const tmp = list[i];
				list[i] = list[r];
				list[r] = tmp;
			}

			let cnt = 0;
			for (let y = 0; y < ballH; y++) {
				for (let x = 0; x < ballW; x++) {
					const ball = balls[y][x];
					if (ball.tag === -1) {
						const num = list[cnt];
						ball.tag = num;
						if (num === -1) {
							ball.hide();
						} else {
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
		const shuffle = () => {
			const list = Array.prototype.concat.apply([], balls);//一次元化
			//シャッフル
			for (let i = list.length - 1; i > 0; i--) {
				const r = scene.random.get(0, i);
				const tmp = list[i];
				list[i] = list[r];
				list[r] = tmp;
			}

			let cnt = 0;
			for (let y = 0; y < ballH; y++) {
				for (let x = 0; x < ballW; x++) {
					balls[y][x] = list[cnt];
					base.append(list[cnt]);
					timeline.create(list[cnt]).moveTo(x * ballSize, y * ballSize, 500);
					cnt++;
				}
			}
		};

		let isStop = false;
		let ballCnt = 60;
		//リセット
		this.reset = () => {
			labelCombo.hide();
			sprAll.hide();

			btnAdd.show();
			shuffleCnt = 2;
			labelShuffle.text = "*" + shuffleCnt;
			labelShuffle.invalidate();

			ballCnt = 0;
			for (let y = 0; y < ballH; y++) {
				for (let x = 0; x < ballW; x++) {
					const ball = balls[y][x];
					ball.tag = -1;
					ball.hide();
				}
			}

			lines.forEach(line => line.hide());
			selectArea.hide();

			setBalls();
			isStop = false;

		};

	}
}
