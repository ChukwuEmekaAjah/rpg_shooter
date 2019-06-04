import React from "react";

class Game extends React.Component {
	constructor(props){
		super();
		this.state = {player_position:{x:130, y:0}, bullets:[], targets:[], score: 0, countDown:60};
		this.player_dimension = {width:10, height:10};
		this.bullet_dimension = {width:3, height:3};
		this.target_dimension = {width: 6, height: 6};
		this.handleAction = this.handleAction.bind(this);
		this.bulletIntervalId = '';
		this.countDownIntervalId = '';
	}

	drawCanvas(){
		let canvas = document.getElementById("canvas");
		let context = canvas.getContext('2d');
		context.fillStyle = "red";
		context.fillRect(0,0,360, 640);

		context.fillStyle = "black";
		
		let player_image = new Image();
		player_image.src = "/characters/goblin.png";
		player_image.onload = context.drawImage(player_image, this.state.player_position.x, this.state.player_position.y, 10,10);
		context.fillStyle ="black";
		this.state.bullets.forEach((bullet) => {
			context.fillRect(bullet.x, bullet.y, this.bullet_dimension.width, this.bullet_dimension.height);
		})

		this.state.targets.forEach((target) => {
			//context.fillRect(target.x, target.y, this.target_dimension.width, this.target_dimension.height);
			let target_image = new Image();
			target_image.src = "/characters/rat.png";
			target_image.onload = context.drawImage(target_image, target.x, target.y, 10,10);

		})
		this.updateBulletPosition();
	}

	componentDidMount(){
		this.drawCanvas();
		let initial_targets = [];
		for(var i = 0; i < 10; i++ ){
			let new_target = {x: Math.floor(Math.random() * 354), y: 200};
			initial_targets.push(new_target);
		}
		this.createTarget(initial_targets);
		window.addEventListener('keyup',this.handleAction);
		this.countDownTimer();
	}

	countDownTimer(){
		if(this.countDownIntervalId){
			clearTimeout(this.countDownIntervalId);
		}

		if(this.state.countDown == 0){
			return;
		}

		setTimeout(() => {
			let countDown = this.state.countDown - 1 ;
			this.setState({countDown });
			this.countDownTimer();
		}, 1000)
	}

	createTarget(inview_targets){
		if(this.state.countDown == 0){
			return;
		}
		let targets = inview_targets;
		
		targets.forEach((target) => {
			target.y -= 1;
		});


		targets = targets.filter((target) => {
			if(target.y > 0){
				return target;
			}
		})
		if(targets.length < 10){
			let new_target = {x: Math.floor(Math.random() * 354), y: 200};
				targets.push(new_target);
		}

		return targets;
	}

	checkForCollision(inview_bullets,inview_targets){

		let bullets = inview_bullets;
		let targets = inview_targets;
		var shot_targets = [];
		var effective_bullets = [];

		for(var x = 0; x < bullets.length; x++){
			for(var i = 0; i < targets.length ; i++){
				if ( (((bullets[x].y + this.bullet_dimension.height) > targets[i]['y'] ) && 
					 ((bullets[x].y + this.bullet_dimension.height) < (targets[i]['y'] + this.target_dimension.height))) &&
					 (
					 	(((bullets[x].x + this.bullet_dimension.width) > targets[i]['x']) && ((targets[i]['x'] + this.target_dimension.width) > (bullets[x].x + this.bullet_dimension.width))) ||
					 	(((bullets[x].x + this.bullet_dimension.width) > targets[i]['x']) && ((targets[i]['x'] + this.target_dimension.width) > (bullets[x].x)) ) ||
					 	( ( (bullets[x].x + this.bullet_dimension.width) > targets[i]['x'] ) && (targets[i]['x'] > bullets[x].x) )
					 )
					){
					shot_targets.push(targets[i]);
					effective_bullets.push(bullets[x]);
					break;
				}
			}
		}

		if(!shot_targets.length){
			return { bullets:inview_bullets, targets:inview_targets, score:this.state.score};
		}
		
		let ineffective_bullets = [];
		for(var j = 0; j < bullets.length; j++){
			for(var i = 0; i < effective_bullets.length; i++){
				if(bullets[j].x != effective_bullets[i].x && bullets[j].y != effective_bullets[i].y){
					ineffective_bullets.push(bullets[j]);
					break;
				}
			}
		}

		let unshot_targets = [];
		for(var j =0; j < targets.length; j++){
			for(var i = 0; i < shot_targets.length; i++){
				if(targets[j].x != shot_targets[i].x && targets[j].y != shot_targets[i].y){
					unshot_targets.push(targets[j]);
					break;
				}
			}
		}
	
		let score = this.state.score + shot_targets.length;
		return {score: score, bullets:ineffective_bullets, targets:unshot_targets};
	}

	updateBulletPosition(){
		if(this.bulletIntervalId){
			clearTimeout(this.bulletIntervalId);
		}
		if(!this.state.bullets.length){
			return;
		}
		let bullets = this.state.bullets;
		bullets.forEach((bullet) =>{
			bullet.y += 3;
		});
		bullets = bullets.filter((bullet) => {
			if(bullet.y < 640){
				return bullet;
			}
		});
		let targets = this.state.targets;
		let visible_targets_and_bullets = this.checkForCollision(bullets,targets);
		this.bulletIntervalId = setTimeout(() => {
			let updated_targets = this.createTarget(visible_targets_and_bullets['targets']);
			if(!updated_targets){
				alert(`Hello man! This is the end. You could only kill ${this.state.score} targets in 60 seconds`);
				return;
			}
			this.setState({bullets:visible_targets_and_bullets['bullets'], targets:updated_targets, score:visible_targets_and_bullets['score']});
			this.updateBulletPosition();
		},100);
	}

	shoot(){
		if(this.state.countDown == 0){
			alert("this is the end ");
			return;
		}
		let bullet_position = {x:(this.state.player_position.x)+ this.player_dimension.width/2, y: 10};
		let bullets = this.state.bullets.slice();
		bullets.push(bullet_position);
		this.setState({bullets});
	}

	handleAction(e){

		let x_directions = {37:'left', 39:'right'};
		if(e.which == 32){
			this.shoot();
			return;
		}
		let direction = e.target.dataset.direction? e.target.dataset.direction : x_directions[e.which];
		let displacement = direction == 'right' ? 5 : direction == 'left'? -5 : 0;

		console.log("the desired direction is ",direction);

		let within_coordinates = ((this.state.player_position.x + displacement) >= 0) && ((this.state.player_position.x + this.player_dimension.width + displacement) <= 300) ? true : false;
		if(within_coordinates){
			let player_position = this.state.player_position;
			player_position.x += displacement;
			this.setState({player_position:player_position});
		}
	}

	componentDidUpdate(){
		this.drawCanvas();
	}
	
	render(){
		return (
			<div >
				<canvas id="canvas" > 
				</canvas>
				<div className="container">
					<div className="row" style={{width:360}}>
						<div className="col-6 col-lg-6 col-md-6 col-xl-6 controls__movement">
							<button className="control-button " onClick={ this.handleAction } data-direction="left"> {'<'} </button>
							<button className="control-button " onClick={ this.handleAction } data-direction="right"> {'>'} </button>
						</div>
						<div className="col-2 col-lg-2 col-md-2 col-xl-2 center">
							<h3> {this.state.score} </h3>
							<h3> {this.state.countDown} </h3>
						</div>
						<div className="col-4 col-lg-4 col-md-4 col-xl-4 center">
							<button className="control-button pull-right" onClick={() => {return this.shoot()}} > ^ </button>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default Game;
