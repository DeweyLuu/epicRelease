var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var requests = require('request');
var rally = require('rally');
var queryUtils = rally.util.query;
var fs = require('fs');
var json2csv = require('json2csv');

var restApi = rally({
	apiKey: '_HSiq55uzTLKnoJO1qQTymYClsbsXS0Uhw8uGRME',
	requestOptions: {
    headers: {
      'X-RallyIntegrationName': 'My cool node.js program',
      'X-RallyIntegrationVendor': 'TrueBlue',
      'X-RallyIntegrationVersion': '1.0'
    }
  }
});

var bigStories = [];

function nodePromise(fn) {
	return new Promise(function(resolve, reject) {
		fn(function(err, res) {
			if (err) reject(err);
			else resolve(res);
		});
	});
}

function query(params) {
	return nodePromise(function(cb){
		restApi.query(params, cb);
	})
}

function entireQueryWithPromises() {
	query({
	    type: 'PortfolioItem/Epic', //the type to query
	    start: 1, //the 1-based start index, defaults to 1
	    pageSize: 2, //the page size (1-200, defaults to 200)
	    limit: Infinity, //the maximum number of results to return- enables auto paging
	    fetch: ['FormattedID', 'Name', 'UserStories', 'Release'], //the fields to retrieve
	    query: queryUtils.where('Release.Name', '=', '16.35'),
	    scope: {
	        workspace: '/workspace/48926045219',
	    },
	})
	.then(function(topResult){		
      	var theResults = topResult.Results;      	
      	var resultPromises = theResults.map(function(result, i) {
      	var cutUp = theResults[i].UserStories._ref.slice(47, theResults[i].UserStories._ref.length);
      	bigStories.push(theResults[i]);	
			return query({
			    ref: cutUp,
			    start: 1, //the 1-based start index, defaults to 1
			    pageSize: 200, //the page size (1-200, defaults to 200)
			    limit: Infinity, //the maximum number of results to return- enables auto paging
			    fetch: ['FormattedID', 'Name', 'Epic'],
			});
    	});

		return Promise.all(resultPromises)
			.then(function(allPromises) {
				return [topResult].concat(allPromises);
			})
	})
    .then(function(everything) {
    	var newnew = [];
    	var topResult = everything[0];
    	var secondaryResults = everything.slice(1);
    	//console.log(secondaryResults);
    	
    	for (var i = 0; i < secondaryResults.length; i++) {
    		for (var j = 0; j < secondaryResults[i].Results.length; j++) {
    			theStories.push(secondaryResults[i].Results[j]);
    		}
    	}

		var gotDate = new Date();
        var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var gotDate1 = month[gotDate.getMonth()];
        var gotDate2 = gotDate.getDate();
        var gotDate3 = gotDate.getFullYear();
        var gotDate4 = gotDate.getHours();
        if (gotDate4 < 10) {
        	gotDate4 = "0" + gotDate4;
        }
        var gotDate5 = gotDate.getMinutes();
        if (gotDate5 < 10) {
        	gotDate5 = "0" + gotDate5;
        }
        var theTimeStamp = gotDate3 + gotDate1 + gotDate2 + "-" +  gotDate4 + gotDate5;

        console.log(theTimeStamp);   

		var fields = ['Name', 'FormattedID', 'Epic.Name', 'Epic.FormattedID'];

    	json2csv({data: theStories, fields: fields}, function(err, csv) {
        	if (err) console.log(err);
        	fs.writeFile('releaseReportPromise' + theTimeStamp + '.csv', csv, function(err) {
        		if(err) throw err;
        		console.log('file saved!');
        	})
        }) 

    	console.log(theStories.length);
    })
	.catch(function(err) {
		console.error(err);
		process.exit(1);
	});
}

entireQueryWithPromises();

app.listen(3000, function() {
	console.log('server started');
});
