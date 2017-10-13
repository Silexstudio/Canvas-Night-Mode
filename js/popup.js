function shade( p ){
	if(p){
		$('body').removeClass('lightmode');
		$('.nightmode').addClass('on');
	}
	else{
		$('body').addClass('lightmode');
	}
}

chrome.storage.sync.get(['nightmode', 'notifications', 'sound', 'types', 'userdata'], function( obj ){
	shade(obj.nightmode);
	if(obj.notifications){
		$('.notifications').addClass('on');
		$('.notif').show();
	}
	$('.notification-type option[value="' + obj.types + '"]').attr('selected', true).change();
	$('.notification-sound option[value="' + obj.sound + '"]').attr('selected', true);
	if(obj.userdata.courses){
		obj.userdata.courses.forEach(function(val, i){
			$('.grades ul').append('<li courseid="' + val.id + '" ' + (parseInt(obj.userdata.coursesGrades[i]) ? 'check' : 'empty')  + '>' + (val.id + ' - ' + val.name) + '</li>');
		});

		$('.grades li').click(function(){
			chrome.tabs.create({
				'url': 'https://canvas.cs.ubbcluj.ro/courses/' + $(this).attr('courseid'),
				'active': true, 
			});
		});
	}
	else{
		$('.course-notice').html('There are no favourite courses! Add them');
	}
});

$('.switch').click(function(){
	$(this).toggleClass('on');
});

$('.nightmode').click(function(){
	let nightmode = $(this).hasClass('on');
	chrome.storage.sync.set({'nightmode': nightmode});
	shade(nightmode);
});

$('.notifications').click(function(){
	let notif = $(this).hasClass('on');
	chrome.storage.sync.set({'notifications': notif});
	if(notif) $('.notif').show();
	else $('.notif').hide();
});

[
	'Default.mp3',
	'Wubba-lubba-dub-dub.mp3',
	'Omae-wa-mou-shindeiru.mp3',
	'My-name-is-Jeff.mp3',
	'Windows-XP.mp3'
].forEach(function(val){
	$('.notification-sound').append('<option value="' + val + '">' + val.split('.')[0] + '</option>');
});

var audio;
$('.notification-sound').change(function(){
	if(audio)audio.pause();
	audio = new Audio();
	audio.src = '../art/' + $(this).val();
	audio.play();
	chrome.storage.sync.set({'sound': $(this).val()});
});

$('.notification-type').change(function(){
	let val = parseInt($(this).val());
	chrome.storage.sync.set({'types': val});
	if(val != 1){
		$('.grades').show();
	}
	else{
		$('.grades').hide();
	}
});

$('.courses').click(function(){
	chrome.tabs.create({
		'url': 'https://canvas.cs.ubbcluj.ro/courses',
		'active': true, 
	});
});