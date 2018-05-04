$(function() {
  $("#calendar").fullCalendar({
    defaultView: "agendaWeek",
    scrollTime: "07:00:00",
    slotDuration: "00:30:00",
    slotLabelInterval: "01:00",
    columnHeaderFormat: "ddd DD.MM.YYYY",
   // titleFormat: "ddd DD.MM.YYYY",
    views: {
      agendaDay: {
        titleFormat: "dddd, DD.MM.YYYY",
      },
      agendaWeek: {
        titleFormat: "DD.MM.YYYY",
      }
    },
    // TODO: get total booked hours per day
    columnHeaderHtml: function(mom) {
      return mom.format("ddd DD.MM.YYYY")+"<div>02:00h</div>";
    },
    eventRender: function(event, element) {
      if (event.task) {
        element.append("<div>"+event.task+"</div>");
      }
    },
    header: {
      left:   "title agendaDay,agendaWeek",
      center: "",
      right:  "today prev,next"
    },
    selectable: true,
    select: function(startDate, endDate) {
      $("#frm-timelog").form("set value", "date", startDate.format("DD.MM.YYYY"));
      $("#frm-timelog").form("set value", "time", startDate.format("HH:mm"));
      $("#frm-timelog").form("set value", "duration", formatDuration(endDate.diff(startDate, "minutes")));
      // TODO: Do not allow more than 12 hours
      $("#modal-timelog").modal("show");
      // TODO: Set focus on task dropdown
      $("#dropdown-tasks").focus();
    },
    selectConstraint:{
      start: '00:00',
      end: '24:00'
    }, 
    eventSources: [
    {
      id: "Zoho",
      editable: true,
      events: [
        {
          title  : "Weekly Call",
          task   : "Tessinerplatz 7",
          start  : "2018-04-12T10:00:00",
          end    : "2018-04-12T12:00:00"
        },
        {
          title  : "Tactical",
          task   : "Behind the scenes",
          start  : "2018-04-12",
          allDay : true
        }
      ]
    },
    {
      id: "GCal",
      editable: false,
      backgroundColor: "grey",
      events: [
        {
          title  : "TelCo Wohnzimmer",
          start  : "2018-04-12T10:00:00",
          end    : "2018-04-12T12:00:00"
        },
        {
          title  : "Meeting UBS",
          start  : "2018-04-12T14:00:00",
          end    : "2018-04-12T15:00:00"
        }
      ]
    }
  ]
  });
});


const regexDuration = /^\d*([:]?|[.])?\d+$/;
const regexTime = /^\d{1,2}[:]\d{1,2}$/;
const regexDate = /^\d{1,2}[.]\d{1,2}[.](?:\d{4}|\d{2})$/;
const zohoBaseUrl = "https://time.villageoffice.ch/zoho-api/portal/villageoffice/";
const zohoProjectsKey = "zoho-projects";
const zohoTaskKey = "zoho-task";
var taskListDropdown = [];

$("#btn-add").click(function() {
  $("#modal-timelog").modal("show");
});

// Get projects
$("#btn-refresh").click(function() {
  getTaskEntries();
});

// Post a test time log to Zoho
$("#btn-put").click(function() {
  postTimelogToZoho();
});

$("#frm-timelog").submit(function() {
  var taskDateObj = moment($("#frm-timelog").form("get value", "date"), "DD.MM.YYYY");
  var idArray = $("#dropdown-tasks").dropdown("get value").split("|");
  var projectId = idArray[0];
  var taskId = idArray[1];
  var taskDate = taskDateObj.format("MM-DD-YYYY");
  var taskOwner = "20062563695";
  var taskBillStatus = $("#checkbox-billable").checkbox("is checked") ? "Billable" : "Non Billable";
  var taskHours = $("#frm-timelog").form("get value", "duration");
  var taskNotes = $("#frm-timelog").form("get value", "description");
  var taskUrl = zohoBaseUrl + "projects/" + projectId + "/tasks/" + taskId + "/logs/?";
  var taskData = $.param({
         authtoken: "bf97913da8a83b9bbccaa87e66242727",
         date: taskDate,
         owner: taskOwner,
         bill_status: taskBillStatus,
         hours: taskHours,
         notes: taskNotes
  });
    
  $.ajax({
    type: "POST",
    url: taskUrl + taskData,
    success: alertSuccess,
    dataType: "json"
  });
})

function formatDuration(minutes) {
  durationMoment = moment("2018-01-01 00:00", "YYYY-MM-DD HH:mm");
  durationMoment.add(minutes, "minutes");
  return durationMoment.format("HH:mm");
}


function postTimelogToZoho() {
  var projectId = "21131000000006326";
  var taskId = "21131000000055113";
  var taskDate = "04-27-2018"; // Format must be MM-DD-YYYY
  var taskOwner = "20062563695";
  var taskBillStatus = "Non Billable";
  var taskHours = "00:30";
  var taskNotes = "This is a TEST!";
  var taskUrl = zohoBaseUrl + "projects/" + projectId + "/tasks/" + taskId + "/logs/?";
  var taskData = $.param({
         authtoken: "bf97913da8a83b9bbccaa87e66242727",
         date: taskDate,
         owner: taskOwner,
         bill_status: taskBillStatus,
         hours: taskHours,
         notes: taskNotes
  });
    
  $.ajax({
    type: "POST",
    url: taskUrl + taskData,
    success: alertSuccess,
    dataType: "json"
  });

}

function alertSuccess( data ) {
  alert( "Data Loaded: " + JSON.stringify(data) );
}

// Gets all entries in the "Task" Dropdown. Tries to fetch from cache first, in order to avoid rate limits in Zoho
function getTaskEntries() {
  var currentProject = localStorage.getItem(zohoProjectsKey);
  
  // This is the case of HTTP 204, when there are no projects. Nothing to do, return.
  if (currentProject == "undefined") {
    return;    
  }
  
  if(currentProject) {
    // Get projects from cache
    try {
      zohoProjects = JSON.parse(currentProject);
      getTasksFromZoho(zohoProjects);
    } catch (e) {
      console.log(e.name + ': ' + e.message);
      console.log(JSON.stringify(currentProject));
    }
  } else {
    // Get projects from the ZOHO API
    $.getJSON( zohoBaseUrl+"projects/", { authtoken: "bf97913da8a83b9bbccaa87e66242727", status: "active" }, function(data) {
      // Always cache the response to prevent further API calls, but only go on if there was data.
      localStorage.setItem(zohoProjectsKey, JSON.stringify(data));
      if (data) {
        getTasksFromZoho(data);
      }
    });
  }
}

// Iterates over the list of Zoho projects and gets the tasks for each
function getTasksFromZoho(zohoProjectsArray) {
  zohoProjectsArray.projects.forEach(function(element) {
    getZohoTasksForProject(element.id_string, element.name);
  });
}

function getZohoTasksForProject(zohoProjectId, zohoProjectName) {
  if (!zohoProjectId) { return; }
  var storageId = zohoTaskKey+"."+zohoProjectId;
  var currentTask = localStorage.getItem(storageId);
  
  // This is the case of HTTP 204, when there are no tasks for this project. Nothing to do, return.
  if (currentTask == "undefined") {
    return;    
  }
  
  if(currentTask) {
    // Get tasks from cache
    try {
      zohoTasks = JSON.parse(currentTask);
      updateTaskList(zohoTasks, zohoProjectName, zohoProjectId);
    } catch (e) {
      console.log(e.name + ": " + e.message);
      console.log("storageId: " + storageId);
    }
  } else {
    // Get tasks from the ZOHO API
    $.getJSON( zohoBaseUrl+"projects/"+zohoProjectId+"/tasks/", { authtoken: "bf97913da8a83b9bbccaa87e66242727", owner: "20062563695", status: "notcompleted", time: "all", priority: "all" }, function( data ) {
      // Always cache the response to prevent further API calls, but only go on if there was data.
      localStorage.setItem(storageId, JSON.stringify(data));
      if (data) {
        updateTaskList(data, zohoProjectName, zohoProjectId);
      }
    });
  }
}

function updateTaskList(zohoTasksArray, zohoProjectName, zohoProjectId) {
  var displayName;  
  
  zohoTasksArray.tasks.forEach(function(element) {
    if (element.subtasks) {
      console.log("Subtasks detected for Task ID: " + element.id_string);
    }
    displayName = element.name + " (" + zohoProjectName + " | " + element.tasklist.name + ")";
    taskListDropdown.push({
      name: displayName,
      value: zohoProjectId+ "|" + element.id_string
    });
  });
  
  taskListDropdown.sort(function(a, b) {
    return (a.name).localeCompare(b.name);
  });
  
  $('#dropdown-tasks').dropdown({
    values: taskListDropdown,
    placeholder: 'Select Task',
    showOnFocus: false,
    fullTextSearch: true,
    sortSelect: true
  })
}

$("#frm-timelog")
  .form({
    on: "blur",
    inline: true,
    fields: {
      description: {
        identifier  : "description",
        depends     : "billable",
        rules: [
          {
            type   : "empty",
            prompt : "For a billable entry, the description is mandatory"
          }
        ]
      },
      date: {
        identifier  : "date",
        rules: [
          {
            type   : "regExp",
            value  : regexDate,
            prompt : "Please enter the start date in format dd.mm.yyyy"
          }
        ]
      },
      time: {
        identifier  : "time",
        rules: [
          {
            type   : "regExp",
            value  : regexTime,
            prompt : "Please enter the start time in format hh:mm"
          }
        ]
      },
      duration: {
        identifier  : "duration",
        rules: [
          {
            type   : "regExp",
            value  : regexDuration,
            prompt : "Please enter the duration as hh:mm (e.g. 00:15 for 15 minutes)"
          }
        ]
      }
    }
  })
;

// TODO: Set this value from the selected project
$("#frm-timelog").form("set value", "billable", false);

// TODO: Does not work on mobile (iOS)
$("input[name=duration]").focus(function(){
  $(this).select();
});

// Field manipulation for date
$("input[name=date]").blur(function(){
  var inputVar = $(this).val();
  var output = "";
  
  // Sanitize input. If valid, create moment.js object
  if (regexDate.test(inputVar)) {
    formDate = moment(inputVar, "DD-MM-YYYY");
  } else {
    return;
  }
  
  // Get the formatted date (or empty if invalid)
  output = formDate.isValid() ? formDate.format("DD.MM.YYYY") : "";

  // Write formatted output to field
  $(this).val(output);
  
  // Call validation to make invalid input visible
  $("#frm-timelog").form("validate field", "date");
});

// Field manipulation for time
$("input[name=time]").blur(function(){
  var inputVar = $(this).val();
  var output = "";
  
  // Sanitize input. If valid, create moment.js object
  if (regexTime.test(inputVar)) {
    formTime = moment("2018-01-01 "+inputVar, "YYYY-MM-DD HH:mm");
  } else {
    return;
  }
  
  // Get the formatted date (or empty if invalid)
  output = formTime.isValid() ? formTime.format("HH:mm") : "";
  
  // Write output to field
  $(this).val(output);
  
  // Call validation to make invalid input visible
  $("#frm-timelog").form("validate field", "time");
});
                                 
// Field manipulation for duration
$("input[name=duration]").blur(function(){
  var output = "";
  var minutes = 0;
  var hours = 0;
  var splitChar = ":";
  var inputVar = $(this).val();
  var inputArr = Array();
  
  // Sanitize input. If valid, split at colon
  if (regexDuration.test(inputVar)) {
    if (inputVar.indexOf(".") !== -1) { splitChar = "."; }
    inputArr = inputVar.split(splitChar);
  } else {
    return;
  }
  
  // no splitChar: treat input as hours
  if (inputArr.length == 1) {
      hours = inputArr[0] ? parseInt(inputArr[0]) : 0;
  }
  
  // one splitChar -> treat input as hh:mm
  if (inputArr.length == 2) {
      hours = inputArr[0] ? parseInt(inputArr[0]) : 0;
      minutes = inputArr[1] ? parseInt(inputArr[1]) : 0;
  }
  
  // point as splitChar -> treat minutes as decimal
  if (splitChar == ".") {
    var decMinutes = Math.round(60 * parseFloat(hours+"."+minutes));
    hours = Math.floor(decMinutes / 60);
    minutes = decMinutes % 60;
  }
  
  // Create a moment.js object (we don"t use the duration object because it does not support formatted output)
  formDuration = moment("2018-01-01 "+hours+":"+minutes, "YYYY-MM-DD HH:mm");
  
  // Durations of more than 12 hours are not allowed
  if (formDuration.isAfter("2018-01-01 12:01:00")) {
    $("input[name=duration]").transition("shake");
    formDuration = moment("2018-01-01 00:00", "YYYY-MM-DD HH:mm");
  }
  
  // Get the formatted date (or empty if invalid)
  output = formDuration.isValid() ? formDuration.format("HH:mm") : "";
  
  // Write output to field
  $(this).val(output);
  
  // Call validation to make invalid input visible
  $("#frm-timelog").form("validate field", "duration");
});
