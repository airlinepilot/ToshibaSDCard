/**
 *  main.js
 *
 *  Created by Junichi Kitano, Fixstars Corporation on 2013/05/15.
 * 
 *  Copyright (c) 2013, TOSHIBA CORPORATION
 *  All rights reserved.
 *  Released under the BSD 2-Clause license.
 *   http://flashair-developers.com/documents/license.html
 */
// JavaScript Document

// Judge the card is V1 or V2.
function isV1(wlansd) {
	if ( wlansd.length == undefined || wlansd.length == 0 ) {
		// List is empty so the card version is not detectable. Assumes as V2.
		return false;
	} else if ( wlansd[0].length != undefined ) {
		// Each row in the list is array. V1.
		return true;
	} else {
		// Otherwise V2.
		return false;
	}
}
// Convert data format from V1 to V2.
function convertFileList() {
	for (var i = 0; i < wlansd.length; i++) {
		var elements = wlansd[i].split(",");
		wlansd[i] = new Array();
		wlansd[i]["r_uri"] = elements[0];
		wlansd[i]["fname"] = elements[1];
		wlansd[i]["fsize"] = Number(elements[2]);
		wlansd[i]["attr"]  = Number(elements[3]);
		wlansd[i]["fdate"] = Number(elements[4]);
		wlansd[i]["ftime"] = Number(elements[5]);
	}
}
// Callback Function for sort()
function cmptime(a, b) {
	if( a["fdate"] == b["fdate"] ) {
		return a["ftime"] - b["ftime"];
	}else{
		return a["fdate"] - b["fdate"];
	}
}
// Show file list
function showFileList(path) {
	// Clear box.
	Capacity();
	
	if ( path == "" || path == "/" ) {
		$("#path").html(
			$('<li></li>').append( 
				$( '<a>Home</a>' ).click( function(){
					getFileList('/', true);
				})
			)
		);
	} else {
		$("#path").html('');
		var ipath = [];
		$.each( path.split("/"), function(idx, elem) {
			ipath.push(elem);
			$("#path").append(
				$('<li></li>').append(
					$( '<a></a>').data('path', ipath.join('/')).text(elem == "" ? "Home" : elem).click( function(event) {
						var p = $(event.currentTarget).data('path');
						getFileList(p == "" ? '/' : p, true);
					})
				)
			);
		} );
	}
	
	$("#list").html('');
	// Output a link to the parent directory if it is not the root directory.
	//$('<td><a href="javascript:void(0)" class="dir"><img src=/SD_WLAN/img/return.png width=15></a></td><td colspan="4"><a href="javascript:void(0)" class="dir">..</a></td>')
	if( path != "/" ) {
		$("#list").append(
			$("<tr></tr>").append(
				$('<td colspan="4"><span class="glyphicon glyphicon-arrow-up" />&nbsp;&nbsp;<a href="javascript:void(0)" class="dir">..</a></td>')
			)
		);
	}

	$.each(wlansd, function() {
		var file = this;
		// Make a link to directories .
		var filelink = $('<a href="javascript:void(0)"></a>');
		var caption = file["fname"] ;
		var fileicon = '<span class="glyphicon glyphicon-file" />';
		var fileobj = $("<tr></tr>");
		var item='';
		if ( file["attr"] & 0x10 ) {
			filelink.addClass("dir");
			//fileicon = '<img src=/SD_WLAN/img/dir.png  width=15>';
			fileicon = '<span class="glyphicon glyphicon-folder-open" />&nbsp;&nbsp;';
			item = $('<td colspan="4"></td>').append( fileicon, filelink.append( caption  ) );
		} 
		// Append a directory to the end of the list.
		$("#list").append(
			fileobj.append(
				item
			)
		);
	});
	//display the  files
	$.each(wlansd, function() {
		var file = this;
		// Skip hidden file.
		if ( file["attr"] & 0x02 ) {
			return;
		}
		// Make a link to directories and files.
		var filelink = $('<a href="javascript:void(0)"></a>');
		var filedel = '';
		var caption = file["fname"] ;
		var fileicon = '<span class="glyphicon glyphicon-file" />&nbsp;&nbsp;';
		var filedownload='';
		var fileobj = $("<tr></tr>");
		var filesize = file["fsize"];
		var filesizeunit='Byte';
		var filedate = '-';
		if ( file["fdate"] !== 0 ) {
			var fd = new Date(
				((file["fdate"] & 0xfe00) >>> 9) + 1980, 
				(file["fdate"] & 0x1e0) >> 5, 
				(file["fdate"] & 0x1f), 
				(file["ftime"] & 0xf800) >>> 11, 
				(file["ftime"] & 0x7c0) >> 5, 
				(file["ftime"] & 0x1f) * 2
			);
			filedate = fd.toLocaleString();
		}
		var item='';
		if ( ! (file["attr"] & 0x10) ) {
			filelink.addClass("file").attr('href', file["r_uri"] + '/' + file["fname"]).attr("target","_blank");
			filedel=' &nbsp; <span class=\'glyphicon glyphicon-remove\' style=\'cursor:pointer;\' data-path=\'' + file["r_uri"] + '\' data-name=\'' + file["fname"] + '\' data-toggle="modal" data-target="#modalDelete" />';
			filedownload='<span class=\'glyphicon glyphicon-download-alt\' style=\'cursor:pointer;\' onClick=\'window.open(\"'+file["r_uri"] + '/' + file["fname"]+'\");\' />';
			
			item = '<td>' + fileicon + caption + '</td><td>' + fileSize( filesize ) + '</td><td>' + filedate + '</td><td>' + filedownload + '&nbsp;'+ filedel + '</td>';
		}
		// Append a file entry or directory to the end of the list.
		$("#list").append(
			fileobj.append(
				item
			)
		);
	});
}
//Making Path
function makePath(dir) {
	var arrPath = currentPath.split('/');
	if ( currentPath == "/" ) {
		arrPath.pop();
	}
	if ( dir == ".." ) {
		// Go to parent directory. Remove last fragment.
		arrPath.pop();
	} else if ( dir != "" && dir != "." ) {
		// Go to child directory. Append dir to the current path.
		arrPath.push(dir);
	}
	if ( arrPath.length == 1 ) {
		arrPath.push("");
	}
	return arrPath.join("/");
}
// Get file list
function getFileList(dir, abs) {
	// Make a path to show next.
	var absolute = abs | false;
	var nextPath = abs ? dir : makePath(dir);
	// Make URL for CGI. (DIR must not end with '/' except if it is the root.)
	var url = "/command.cgi?op=100&DIR=" + nextPath;
	// Issue CGI command.
	$.get(url, function(data) {
		// Save the current path.
		currentPath = nextPath;
		// Split lines by new line characters.
		wlansd = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		wlansd.shift();
		wlansd.pop();
		// Convert to V2 format.
		convertFileList(wlansd);
		// Sort by date and time.
		wlansd.sort(cmptime);
		
		// Show
		showFileList(currentPath);
	});
}

function Capacity() {
	var url = "/command.cgi?op=140";
	var capacitystring='None';
	$.get(url, function(capa) {
		var Tcapacitystring = capa.split("/") ;
		var snotused = Tcapacitystring[0] ;
		var Tcapacitystring2=Tcapacitystring[1].split(",");
		var nbtotal = Tcapacitystring2[0];
		var bpersec = Tcapacitystring2[1];
		var totalfree = Number(snotused) * Number(bpersec);
		var totalcard = Number(nbtotal) * Number(bpersec);
		var percentused = Number(totalfree/totalfree).toFixed(2);
	
		var prog = $('<div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>');
		prog.attr('aria-valuenow', percentused ).width( percentused+"%");
		
		$("#Capacity").html('Card Free : '+ fileSize(totalfree) + ' / ' + fileSize(totalcard) + ' Used: '+ percentused + '%' );
		$("#Capacity").append(
			$('<div class="progress"></div>').append(
				prog
			)
		);
	});
	
	return false;
}

function getCurrentFatTime() {
	var dt = new Date();
	var dummy = 1 << 16;
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minites = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	return "0x" + (dummy + year + month + date).toString(16).substring(1) + (dummy + hours + minites + seconds).toString(16).substring(1);
}

function fileSize(bytes) {
    var exp = Math.min( Math.log(bytes) / Math.log(1024) | 0, 8);
	if ( exp == 0 ) {
		return bytes.toFixed(0) + ' bytes';
	} else {
		var result = (bytes / Math.pow(1024, exp)).toFixed(2);
		return result + ' ' + (exp == 0 ? 'bytes': 'KMGTPEZY'[exp - 1] + 'iB');
	}
}

//Document Ready
$(function() {
	// Iniialize global variables.
	currentPath = location.pathname;
	wlansd = new Array();
	// Show the root directory.
	getFileList('');
	// Register onClick handler for <a class="dir">
	$(document).on("click","a.dir",function() {
		getFileList(this.text);
	}); 

	$("div#dropzone").dropzone({
		url: "/upload.cgi",
		paramName: "file",
		parallelUploads: 1,
		filesizeBase: 1024,
		createImageThumbnails: false,
		addRemoveLinks: false,
		accept: function(file, done) {
			// Set to readonly / set current time
			$.get("/upload.cgi?WRITEPROTECT=ON&UPDIR=" + makePath(".") + "&FTIME=" + getCurrentFatTime(), function(html) {
				done();
			});
		},
		init: function() {
			//this.on("addedfile", function(file) { 
			//	console.log( "Added file: " + file ); 
			//});
			this.on("complete", function(file) {
				//console.log( "Complete file: ", file );
				this.removeFile(file);
				getFileList(".");
			});
			//this.on("uploadprogress", function(file, progress, bytesSent) {
			//	console.log( "progress " + progress + "% " + bytesSent + "b", file );
			//});
			this.on("error", function(file, errorMessage) {
				//console.log( "error msg: " + errorMessage, file  );
				$.notify({
					title: 'File upload failed for ' + file.name,
					message: '<br/>Error: ' + errorMessage
				},{
					type: 'danger'
				});
			});
			this.on("canceled", function(file, errorMessage) {
				//console.log( "canceled msg: " + errorMessage, file );
				$.notify({
					title: 'File upload canceled !',
					message: '<br/>' + file.name
				},{
					type: 'warning'
				});
			});
			this.on("success", function(file, errorMessage) {
				//console.log( "success", file );
				$.notify('File ' + file.name + ' uploaded');
			});
		}
	});
	
	$('#modalDelete').on('show.bs.modal', function (event) {
		var btn = $(event.relatedTarget);
		var name = btn.data('name');
		var path = btn.data('path');
		var modal = $(this);
		modal.find('.modal-body p').text(name);
		modal.find('button.btn-primary').data('name', name).data('path', path);
	});
	$('#modalDelete button.btn-primary').on('click', function(event) {
		event.preventDefault(); 
		var btn = $(event.currentTarget);
		var name = btn.data('name');
		var path = btn.data('path');
		$('#modalDelete').modal('hide');
		$.get( "/upload.cgi?DEL=" + path + '/' + name , function(html) {
			html2="*"+html+"*";
			if ( html2.indexOf("SUCCESS") ) {
				$.notify('File deleted successful');
				getFileList(".");
			}else{
				$.notify({
					title: 'File delete failed !',
					message: '<br/>' + name
				},{
					type: 'danger'
				});
				console.log("delete error");
				getFileList(".");
			}
		});
		
	});
	
	$.notifyDefaults({
		type: 'success',
		animate: {
			enter: 'animated fadeInRight',
			exit: 'animated fadeOutUp'
		}
	});
});
Dropzone.autoDiscover = false;
