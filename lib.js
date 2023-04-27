// This will be assigned to rows, once the data is ready.
var myData = null;
var rank_list = [];

var preference_songs = [];
var dislike_songs = [];
var recommended_songs = [];
var recommended_artists = [];
var not_recommended_songs = [];

const features = ["acousticness", "danceability", "energy", "instrumentalness", "liveness", "loudness", "speechiness", "tempo", "valence"]
n_features = features.length
	
d3.csv("data.csv")
    .row(function(d) {return {id: parseInt(d.index), name: d.track_name, artist: d.artist_name, artist_id: d.artist_id, acousticness: parseFloat(d.acousticness), danceability: parseFloat(d.danceability),
							  energy: parseFloat(d.energy), instrumentalness: parseFloat(d.instrumentalness), liveness: parseFloat(d.liveness), loudness: parseFloat(d.loudness),
							  speechiness: parseFloat(d.speechiness), tempo: parseFloat(d.tempo), valence: parseFloat(d.valence), popularity: parseFloat(d.popularity)};})
    .get(function(error, rows) {
		myData = rows;
		refresh();
    });

function calculate() {
	n_new_samples = myData.length
	
	n_preference_samples = preference_songs.length
	n_dislike_samples = dislike_songs.length
	
	rank_list = []
	for (let this_id = 0; this_id < n_new_samples; this_id++) {
		if (preference_songs.includes(this_id) || dislike_songs.includes(this_id)) {continue;}
		
		var this_artist = myData[this_id]["artist"]
		
		var preference_style_scores = []
		var preference_artist_scores = []
		for (let preference_index = 0; preference_index < n_preference_samples; preference_index++) {
			var style_score = 0
			for (let feature_index = 0; feature_index < n_features; feature_index++) {
				var feature = features[feature_index]
				style_score += Math.pow(myData[this_id][feature] - myData[preference_index][feature], 2)
			}
			preference_style_scores.push(style_score / n_features)
			if (this_artist == myData[preference_songs[preference_index]]["artist"]) {preference_artist_scores.push(1)} else {preference_artist_scores.push(0)}
		}
		
		var dislike_style_scores = []
		var dislike_artist_scores = []
		for (let dislike_index = 0; dislike_index < n_dislike_samples; dislike_index++) {
			var style_score = 0
			for (let feature_index = 0; feature_index < n_features; feature_index++) {
				var feature = features[feature_index]
				style_score += Math.pow(myData[this_id][feature] - myData[dislike_index][feature], 2)
			}
			dislike_style_scores.push(style_score / n_features)
			if (this_artist == myData[dislike_songs[dislike_index]]["artist"]) {dislike_artist_scores.push(1)} else {dislike_artist_scores.push(0)}
		}
		
		var preference_style_weighted_score = (10 - Math.pow(preference_style_scores.reduce((partialSum, a) => partialSum + a, 0) / Math.max(n_preference_samples, 1), 0.5)) / 10 * 0.6
		var preference_artist_weighted_score = Math.max(...preference_artist_scores.concat([0])) * 0.2
		
		var dislike_style_weighted_score = (10 - Math.pow(dislike_style_scores.reduce((partialSum, a) => partialSum + a, 0) / Math.max(n_dislike_samples, 1), 0.5)) / 10 * 0.3
		var dislike_artist_weighted_score = Math.max(...dislike_artist_scores.concat([0])) * 0.1
		
		var popularity_score = myData[this_id]["popularity"]
		var popularity_weighted_score = popularity_score / 10 * 0.2
		
		var net_score = preference_style_weighted_score + preference_artist_weighted_score - dislike_style_weighted_score - dislike_artist_weighted_score + popularity_weighted_score
		
		var newRow = {id: this_id, preference_style_scores: preference_style_scores, preference_artist_scores: preference_artist_scores,
					  preference_style_weighted_score: preference_style_weighted_score, preference_artist_weighted_score: preference_artist_weighted_score,
					  dislike_style_scores: dislike_style_scores, dislike_artist_scores: dislike_artist_scores,
					  dislike_style_weighted_score: dislike_style_weighted_score, dislike_artist_weighted_score: dislike_artist_weighted_score,
					  popularity_score: popularity_score,
					  popularity_weighted_score: popularity_weighted_score, net_score: net_score, suggested: 0}
		rank_list.push(newRow)
	}
	rank_list = rank_list.sort(function(a,b) {return b.net_score - a.net_score});
}

function recommend() {
	n_samples = rank_list.length
	
	recommended_songs = []
	recommended_artists = []
	for (let i = 0; i < n_samples; i++) {
		id = rank_list[i]["id"]
		if (rank_list[i]["suggested"] == 1) {
			continue;
		}
		
		if (recommended_artists.filter(x => x==myData[id]["artist_id"]).length > 1) {
			continue;
		}
		
		rank_list[i]["suggested"] = 1
		recommended_songs.push(id)
		
		img_id = "rec" + recommended_songs.length.toString() + "_img"
		img = document.getElementById(img_id)
		img.src = "images/" + myData[id]["artist_id"].toString() + ".jpg"
		
		div_id = "rec" + recommended_songs.length.toString()
		div = document.getElementById(div_id)
		div.innerHTML = "<b>" + myData[id]["artist"] + "</b><br>" + myData[id]["name"]
		
		recommended_artists.push(myData[id]["artist_id"])
		
		if (recommended_songs.length == 5) {
			break;
		}
	}
}

function not_recommend() {
	not_recommended_songs = []
	for (let i = 0; i < 5; i++) {
		id = rank_list[rank_list.length - 1 - i]["id"]
		
		not_recommended_songs.push(id)
		
		img_id = "nr" + not_recommended_songs.length.toString() + "_img"
		img = document.getElementById(img_id)
		img.src = "images/" + myData[id]["artist_id"].toString() + ".jpg"
		
		div_id = "nr" + not_recommended_songs.length.toString()
		div = document.getElementById(div_id)
		div.innerHTML = "<b>" + myData[id]["artist"] + "</b><br>" + myData[id]["name"]
	}
}

function refresh() {
	calculate();
	recommend();
	not_recommend();
}

function initialize() {
	console.log("1")
	rank_list = [];

	preference_songs = [];
	dislike_songs = [];
	recommended_songs = [];
	recommended_artists = [];
	not_recommended_songs = [];
	
	pre_innerHTML = ""
	ni_innerHTML = ""
	
	for (let i = 1; i < 6; i++) {
		pre_innerHTML += '<img id="pre' + i.toString() + '_img" class="music_icon"></img>'
		
		div_id = "pre" + i.toString()
		div = document.getElementById(div_id)
		div.innerHTML = ""
		
		ni_innerHTML += '<img id="ni' + i.toString() + '_img" class="music_icon"></img>'
		
		div_id = "ni" + i.toString()
		div = document.getElementById(div_id)
		div.innerHTML = ""
	}
	
	article = document.getElementById("pre_article")
	article.innerHTML = pre_innerHTML
	
	article = document.getElementById("ni_article")
	article.innerHTML = ni_innerHTML
	
	refresh();
}

function choose(x) {
	id = recommended_songs[x]
	preference_songs.push(id)
	
	img_id = "pre" + preference_songs.length.toString() + "_img"
	img = document.getElementById(img_id)
	img.src = "images/" + myData[id]["artist_id"].toString() + ".jpg"
	
	div_id = "pre" + preference_songs.length.toString()
	div = document.getElementById(div_id)
	div.innerHTML = "<b>" + myData[id]["artist"] + "</b><br>" + myData[id]["name"]
	
	if (preference_songs.length == 5) {
		for (let i = 1; i < 6; i++) {
			btn_id = "choose" + i.toString()
			btn = document.getElementById(btn_id)
			btn.disabled = true
		}
	}
	refresh()
}

function pass(x) {
	id = recommended_songs[x]
	dislike_songs.push(id)
	
	img_id = "ni" + dislike_songs.length.toString() + "_img"
	img = document.getElementById(img_id)
	img.src = "images/" + myData[id]["artist_id"].toString() + ".jpg"
	
	div_id = "ni" + dislike_songs.length.toString()
	div = document.getElementById(div_id)
	div.innerHTML = "<b>" + myData[id]["artist"] + "</b><br>" + myData[id]["name"]
	
	if (dislike_songs.length == 5) {
		for (let i = 1; i < 6; i++) {
			btn_id = "pass" + i.toString()
			btn = document.getElementById(btn_id)
			btn.disabled = true
		}
	}
	refresh()
}

function popup(group, id) {
	console.log(id)
	document.querySelector(".popup").style.display = "block";
	
	img_id = group + id.toString() + "_img"
	p_id = group + id.toString()
	document.getElementById("popup_img").src = document.getElementById(img_id).src
	document.getElementById("popup_label").innerHTML = document.getElementById(p_id).innerHTML
	
	var groups = {"rec": recommended_songs, "pre": preference_songs, "ni": dislike_songs, "nr": not_recommended_songs}
	song_id = groups[group][id-1]
	
	popularity = myData[song_id]["popularity"]
	document.getElementById("pop_title").innerHTML = "Popularity:&emsp;" + (Math.round(popularity * 100) / 100).toString()
	document.getElementById("pop_slider").value = Math.round(popularity * 10)
	
	radar_chart(group, id)
}

function radar_chart(group, id) {
	document.getElementById("radar_container").innerHTML = ""
	
	var groups = {"rec": recommended_songs, "pre": preference_songs, "ni": dislike_songs, "nr": not_recommended_songs}
	song_id = groups[group][id-1]
	
	id_list = [song_id].concat(preference_songs)
	
	console.log(id_list)
	var header = ["#"]
	for (let i = 0; i < id_list.length; i++) {
		header.push(myData[id_list[i]]["name"]);
	}
	
	var entries = []
	for (let i = 0; i < n_features; i++) {
		var entry = [features[i]]
		for (let j = 0; j < id_list.length; j++) {
			entry.push(myData[id_list[j]][features[i]]);
		}
		entries.push(entry)
	}
	
	var chartData = {header: header, rows: entries};
	
	var chart = anychart.radar();
	chart.defaultSeriesType("area");
	chart.data(chartData);
	chart.container('radar_container');
	chart.draw();
	
}
document.querySelector("#close").addEventListener("click", function(){
    document.querySelector(".popup").style.display = "none";
});