var intervals = {
	checkLoginState : 12000,
	doCompleteReset : 840001,
	doRefresh : 120000,
	tryLogin : 3000,
};

var Background = (function(){

	var userdata = {},
		oldUserdata;

	var savedVariables = {};

	var loggedIn = false,
		frame = 1; 

	var resetDataInterval,
		refreshDataInterval,
		loginInterval,
		actInterval,
		frameInterval;

	var animateIn = function(){
		frame = 0;
		clearInterval(frameInterval);
		frameInterval = setInterval(function(){
			frame++;
			if(frame > 81){
				frame = 81;
				clearInterval(frameInterval);
			}
			chrome.browserAction.setIcon({path: 'art/favicon/fav_' + frame + '.png'});
		}, 33.36);
	}

	var animateOut = function(){
		clearInterval(frameInterval);
		frameInterval = setInterval(function(){
			frame--;
			if(frame < 1){
				frame = 1;
				clearInterval(frameInterval);
			}
			chrome.browserAction.setIcon({path: 'art/favicon/fav_' + frame + '.png'});
		}, 33.36);
	}

	var notification = function(title, message, stay, href, list, grades){
		chrome.storage.sync.get(['sound', 'notifications'], function( obj ){
			if(obj.notifications){
				if(!obj.sound) obj.sound = "Default.mp3";

				var sound = new Audio();
				sound.src = "art/sound/" + obj.sound;
				sound.play();

				var randId = "Notif" + Math.floor(Math.random() * 100000000);

				
				chrome.notifications.create(
					randId,
					{
						'type': list ? "list" : "basic",
						'iconUrl': 'art/' + (grades ? 'logo_blue.png' : 'logo.png'),
						'title': $('<div/>').html(title).text(),
						'message': $('<div/>').html(message).text(),
						'requireInteraction': stay,
						'items' : list,
					},
					function(){
				});

				chrome.notifications.onClicked.addListener(function( notifId ){
					var id = randId,
						url = href;
					if(notifId == randId){
						chrome.notifications.clear(notifId);
						chrome.tabs.create({
							'url': url,
							'active': true, 
						});
					}
				});
			}
		});
	}

	var pushNotifications = function(){
		chrome.storage.sync.get(['types'], function( obj ){
			if(oldUserdata){
				if(obj.types != 2){
					var diff = oldUserdata.assignments - userdata.assignments;
					if(diff != 0 && savedVariables.assignments.length){
						if(diff > 0){
							console.log("Something unusual happened (assignments). %s < %s", userdata.assignments, oldUserdata.assignments);
						}
						else{
							diff *= -1;

							var first = savedVariables.assignments[0].name;
							var count = 1;
							var list = new Array();
							list.push({title: first, message: savedVariables.assignments[0].title});
							for(let i = 1; i < diff; i++){
								if(savedVariables.assignments[i].name == first){
									count++;
								}
								var listItem = {};
								listItem.title = $('<div/>').html(savedVariables.assignments[i].name).text();
								listItem.message = $('<div/>').html(savedVariables.assignments[i].title).text();
								list.push(listItem);
							}

							var title;
							if(count > 1){
								title = "You have " + count + " new assignments in " + first;
								more = diff - count;
								if(more != 0){
									title += " and " + more + " more in others.";
								}
								else{
									title += ".";
								}
							}
							else{
								title = "You have a new assignment in " + first + ".";
							}

							notification(
								title,
								"You have " + diff + " new assignment notifications. Click here to see them!",
								true,
								"https://canvas.cs.ubbcluj.ro/",
								list
							);
						}
					}

					var diff = oldUserdata.announcements - userdata.announcements;
					if(diff != 0 && savedVariables.announcements.length){
						if(diff > 0){
							console.log("Something unusual happened (announcements). %s < %s", userdata.announcements, oldUserdata.announcements);
						}
						else{
							diff *= -1;

							var first = savedVariables.announcements[0].name;
							var count = 1;
							var list = new Array();
							list.push({title: first, message: savedVariables.announcements[0].title});
							for(let i = 1; i < diff; i++){
								if(savedVariables.announcements[i].name == first){
									count++;
								}
								var listItem = {};
								listItem.title = $('<div/>').html(savedVariables.announcements[i].name).text();
								listItem.message = $('<div/>').html(savedVariables.announcements[i].title).text();
								list.push(listItem);
							}

							var title;
							if(count > 1){
								title = "You have " + count + " new announcements in " + first;
								more = diff - count;
								if(more != 0){
									title += " and " + more + " other.";
								}
								else{
									title += ".";
								}
							}
							else{
								title = "You have a new announcement in " + first + ".";
							}

							notification(
								title,
								"You have " + diff + " announcements. Click here to see them!",
								true,
								"https://canvas.cs.ubbcluj.ro/",
								list
							);
						}
					}
				}
				if(obj.types != 1){
					try{
						if(userdata.courses.length != oldUserdata.courses.length){
							throw "Length is not the same.";
						}
						else{
							for(i = 0; i < userdata.courses.length; i++){
								if(userdata.courses[i].id != oldUserdata.courses[i].id){
									throw "Array items are different.";
								}

								if(userdata.coursesGrades[i] > oldUserdata.coursesGrades[i]){
									notification(
										"You have " + (userdata.coursesGrades[i] - oldUserdata.coursesGrades[i]) + " new grades in " + userdata.courses[i].name.replace(/&amp;/g, '&') + ".",
										"Click here to see them!",
										true,
										"https://canvas.cs.ubbcluj.ro/courses/" +  userdata.courses[i].id + "/grades",
										null,
										true
									);
								}

							}
						}
					}
					catch(err){
						console.log("Something unusual happened (courses): %s", err);
					}
				}
			}
		});
	}

	var setUserData = function(){
		console.log('User data set in sync storage.');
		chrome.storage.sync.set({'userdata' : userdata});
	}

	var getUrl = function(dataret, url){
		let prevState = loggedIn;
		loggedIn = false;

		$.ajax({
			url: url,
			type : 'GET',
			async : false,
			success: function(data){
				if(!data.includes('id="login_form"')){
					console.log("Succesfully querying %s.", url);
					loggedIn = true;
					dataret.data = data;
					animateIn();
				}
			},
			error : function(){
				animateOut();
				console.log('Error during ajax load.');
			}
		});

		if(!loggedIn){
			animateOut();
			console.log("Starting login checks from now.");

			clearInterval(resetDataInterval);
			clearInterval(refreshDataInterval);

			var index = 1;
			loginInterval = setInterval(function(){
				$.ajax({
					url: url,
					type : 'GET',
					async : false,
					success: function(data){
						if(!data.includes('id="login_form"')){
							loggedIn = true;
							console.log("User finally logged in!");
							animateIn();
						}
						else{
							console.log("%s. try: still not logged in.", index);
						}
					},
					error : function(){
						console.log('Error during ajax load.');
					}
				});
				if(loggedIn){
					clearInterval(loginInterval);
					initialize();
					animateIn();
				}
				index++;
			}, intervals.tryLogin);

			throw 500;//All is OK :))
		}
	}

	var getGrades = function(course){
		var tmp = {data : 0};
		getUrl(tmp, "https://canvas.cs.ubbcluj.ro/courses/" + course.id);
		var grades = tmp.data.match(/"submissions":[0-9]*/);
		grades = grades ? grades[0].split(':')[1] : 0;
		console.log('There are ' + grades  + ' grade(s) is ' + course.name + '.');

		return grades;
	}

	var getGradesAll = function(){
		userdata.coursesGrades = [];
		userdata.courses.forEach(function(val){
			userdata.coursesGrades.push(getGrades(val));
		});
	}

	var getCourses = function(){
		var tmp = {data : 0};
		getUrl(tmp, "https://canvas.cs.ubbcluj.ro/courses");

		courses = new Array();

		var coursesContent = tmp.data.match(/course-list-favorite-course(.*\s*){19}/g);

		if(!coursesContent){
			userdata.courses = null;
			throw "No courses selected";
		}

		for(let i = 0; i < coursesContent.length; i++){
			var coursesItem = {};
			coursesItem.id = coursesContent[i].split('data-course-id=')[1].trim().match(/\d+/)[0];
			coursesItem.name = $('<div/>').html(coursesContent[i].split('title="')[2].trim().slice(0,-2)).text();
			courses.push(coursesItem);
		}

		courses.sort(function(a, b){return a.id >= b.id ? 1 : 0});

		console.log("There are %s favourite courses overall.", courses.length);

		userdata.courses = courses;
	}

	var getDashboardInfo = function(){
		var tmp = {data : 0};
		getUrl(tmp, "https://canvas.cs.ubbcluj.ro/dashboard");

		var announcements, assignments;

		var annPos = tmp.data.search('Announcements');
		if(annPos == -1){
			announcements = 0;
		}
		else{
			annPos -= 3;
			while(tmp.data.substr(annPos, 3) != "</b")annPos--;
			var end = annPos;
			while(tmp.data[annPos] != ">")annPos--;
			var begin = annPos+1;

			announcements = parseInt(tmp.data.substr(begin, end-begin));
		}
		console.log("The user has %s announcements on the dashboard.", announcements ? announcements : "no");

		savedVariables.announcements = new Array();
		if(announcements){
			var annContent = tmp.data.match(/\/courses\/\d*\/announcements\/\d*.*\s*.*\s*.*\s*.*/g);
			for(let i = 0; i < annContent.length; i++){
				savedVariables.announcements[i] = {};
				savedVariables.announcements[i].name = annContent[i].match(/fake-link">.*</g)[0].split(">")[1].slice(0, -1);
				savedVariables.announcements[i].title = annContent[i].match(/<\/strong>\s*.*/g)[0].split(">")[1].trim();
			}

			userdata.announcements = announcements;
		}

		var assignPos = tmp.data.search('Assignment Notification');
		if(assignPos == -1){
			assignments = 0;
		}
		else{
			assignPos -= 3;
			while(tmp.data.substr(assignPos, 3) != "</b")assignPos--;
			var end = assignPos;
			while(tmp.data[assignPos] != ">")assignPos--;
			var begin = assignPos+1;

			assignments = parseInt(tmp.data.substr(begin, end-begin));
		}
		console.log("The user has %s assignment notifications on the dashboard.", assignments ? assignments : "no");

		savedVariables.assignments = new Array();
		if(assignments){
			var assignContent = tmp.data.match(/\/courses\/\d*\/assignments\/\d*.*\s*.*\s*.*\s*.*/g);
			for(let i = 0; i < assignContent.length; i++){
				savedVariables.assignments[i] = {};
				savedVariables.assignments[i].name = assignContent[i].match(/fake-link">.*</g)[0].split(">")[1].slice(0, -1);
				savedVariables.assignments[i].title = assignContent[i].match(/<\/strong>\s*.*/g)[0].split(">")[1].trim();
			}

			userdata.assignments = assignments;
		}
	}

	var getCoursesAndGrades = function(){
		try{
			getCourses();
			getGradesAll();
		}
		catch(e){
			console.log('Error while trying to get courses and grades: %s', e);
		}
	}

	var beginRefreshData = function(){
		oldUserdata = Object.assign({}, userdata);
		getDashboardInfo();
		getCoursesAndGrades();
	}

	var beginResetData = function(){
		getDashboardInfo();
		getCoursesAndGrades();
	}

	var resetData = function(){
		actInterval = resetDataInterval;
		console.log("Resetting data.");
		try{
			beginResetData();

			var now = new Date();
			userdata.date = now.getTime();

			setUserData();
		}
		catch(e){
			console.log("Error(%s) while trying to reset data.", e);
		}
	}

	var refreshData = function(){
		actInterval = refreshDataInterval;
		console.log("Refreshing data.");
		try{
			beginRefreshData();
			setUserData();
			pushNotifications();
		}
		catch(e){
			console.log("Error(%s) while trying to refresh data.", e);
		}
	}

	var initialize = function(){
		console.log("==>STARTING<==");

		chrome.storage.sync.get(['userdata'], function( obj ){
			var when;

			refreshDataInterval = setInterval(refreshData, intervals.doRefresh);

			if(obj.userdata == undefined){
				console.log("Data can't be read from the sync storage.");
				when = 0;
			}
			else{
				console.log("Data has been read from the sync storage: %s", JSON.stringify(obj.userdata));
				userdata = Object.assign({}, obj.userdata);

				refreshData();//Pulling in changes when being away for a long time

				var now = new Date();
				now = now.getTime();
				var then = userdata.date + intervals.doCompleteReset;

				if(then < now){
					when = 0;
				}
				else{
					when = then - now;
				}
			}

			console.log("Starting reset interval %s ", when == 0 ? "now." : when/60000 + " minutes from now.");
			setTimeout(function(){
				resetDataInterval = setInterval(resetData, intervals.doCompleteReset);
				resetData();
			}, when);
		});
	}

	var reset = function(){
		chrome.storage.sync.set({'userdata' : null});
		chrome.storage.sync.get(['userdata'], function( obj ){
			console.log(obj);
		});
	}

	return {
		init : initialize,
		reset : reset,
		refreshData : refreshData,
		push : pushNotifications,
		notification : notification
	};

})();

Background.init();