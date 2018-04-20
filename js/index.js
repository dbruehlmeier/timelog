$(function() {
  $('#calendar').fullCalendar({
    defaultView: 'agendaWeek',
    scrollTime: '07:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    columnHeaderFormat: 'ddd DD.MM.YYYY',
   // titleFormat: 'ddd DD.MM.YYYY',
    views: {
      agendaDay: {
        titleFormat: 'dddd, DD.MM.YYYY',
      },
      agendaWeek: {
        titleFormat: 'DD.MM.YYYY',
      }
    },
    // TODO: get total booked hours per day
    columnHeaderHtml: function(mom) {
      return mom.format('ddd DD.MM.YYYY')+'<div>02:00h</div>';
    },
    eventRender: function(event, element) {
      if (event.task) {
        element.append('<div>'+event.task+'</div>');
      };
    },
    header: {
      left:   'title agendaDay,agendaWeek',
      center: '',
      right:  'today prev,next'
    },
    eventSources: [
    {
      id: 'Zoho',
      editable: true,
      events: [
        {
          title  : 'Weekly Call',
          task   : 'Tessinerplatz 7',
          start  : '2018-04-12T10:00:00',
          end    : '2018-04-12T12:00:00'
        },
        {
          title  : 'Tactical',
          task   : 'Behind the scenes',
          start  : '2018-04-12',
          allDay : true
        }
      ]
    },
    {
      id: 'GCal',
      editable: false,
      backgroundColor: 'grey',
      events: [
        {
          title  : 'TelCo Wohnzimmer',
          start  : '2018-04-12T10:00:00',
          end    : '2018-04-12T12:00:00'
        },
        {
          title  : 'Meeting UBS',
          start  : '2018-04-12T14:00:00',
          end    : '2018-04-12T15:00:00'
        }
      ]
    }
  ]
  })
});

const regexDuration = /^\d*([:]?|[.])?\d+$/;
const regexTime = /^\d{1,2}[:]\d{1,2}$/;
const regexDate = /^\d{1,2}[.]\d{1,2}[.](?:\d{4}|\d{2})$/;

$('#btn-add').click(function() {
  $('#modal-timelog').modal('show');
});

var myVal = [];
var i;
for (i = 1; i < 4 ; i++) { 
  myVal.push({
        name: 'Task ' + i,
        value: i
  });
}

myVal.push({
  name: 'Tactical (Behind the Scenes | Pulse)',
  value: 9000
});

myVal.push({
  name: 'Gesamtprojektleitung (Swiss Life, Tessinerplatz 7 | Phase 3: Evaluate)',
  value: 9001
});

myVal.push({
  name: 'XTest (Project | Tasklist)',
  value: 9002
});

//alert(JSON.stringify(myVal));
/*
$.getJSON("https://api.github.com/users/jeresig?authtoken=bf97913da8a83b9bbccaa87e66242727&callback=?",function(json){
  alert(JSON.stringify(json));
});
*/

myVal.sort(sortTasks);
$('#dropdown-tasks')
  .dropdown({
    values: myVal,
    placeholder: 'Select Task',
    showOnFocus: false,
    fullTextSearch: true,
    sortSelect: true
  })

$('#frm-timelog')
  .form({
    on: 'blur',
    inline: true,
    fields: {
      description: {
        identifier  : 'description',
        depends     : 'billable',
        rules: [
          {
            type   : 'empty',
            prompt : 'For a billable entry, the description is mandatory'
          }
        ]
      },
      date: {
        identifier  : 'date',
        rules: [
          {
            type   : 'regExp',
            value  : regexDate,
            prompt : 'Please enter the start date in format dd.mm.yyyy'
          }
        ]
      },
      time: {
        identifier  : 'time',
        rules: [
          {
            type   : 'regExp',
            value  : regexTime,
            prompt : 'Please enter the start time in format hh:mm'
          }
        ]
      },
      duration: {
        identifier  : 'duration',
        rules: [
          {
            type   : 'regExp',
            value  : regexDuration,
            prompt : 'Please enter the duration as hh:mm (e.g. 00:15 for 15 minutes)'
          }
        ]
      }
    }
  })
;

// TODO: Set these values from fullcalendar.js drop event
$('#frm-timelog').form('set value', 'date', '02.04.2018');
$('#frm-timelog').form('set value', 'time', '09:30');
$('#frm-timelog').form('set value', 'duration', '01:00');

// TODO: Set this value from the selected project
$('#frm-timelog').form('set value', 'billable', false);

// TODO: Does not work on mobile (iOS)
$('input[name="duration"]').focus(function(){
  $(this).select();
});

// Field manipulation for date
$('input[name="date"]').blur(function(){
  var inputVar = $(this).val();
  var output = '';
  
  // Sanitize input. If valid, create moment.js object
  if (regexDate.test(inputVar)) {
    formDate = moment(inputVar, "DD-MM-YYYY");
  } else {
    return;
  };
  
  // Get the formatted date (or empty if invalid)
  output = formDate.isValid() ? formDate.format('DD.MM.YYYY') : '';

  // Write formatted output to field
  $(this).val(output);
  
  // Call validation to make invalid input visible
  $('#frm-timelog').form('validate field', 'date');
});

// Field manipulation for time
$('input[name="time"]').blur(function(){
  var inputVar = $(this).val();
  var output = '';
  
  // Sanitize input. If valid, create moment.js object
  if (regexTime.test(inputVar)) {
    formTime = moment('2018-01-01 '+inputVar, 'YYYY-MM-DD HH:mm');
  } else {
    return;
  };
  
  // Get the formatted date (or empty if invalid)
  output = formTime.isValid() ? formTime.format('HH:mm') : '';
  
  // Write output to field
  $(this).val(output);
  
  // Call validation to make invalid input visible
  $('#frm-timelog').form('validate field', 'time');
});
                                 
// Field manipulation for duration
$('input[name="duration"]').blur(function(){
  var output = '';
  var minutes = 0;
  var hours = 0;
  var splitChar = ':';
  var inputVar = $(this).val();
  var inputArr = Array();
  
  // Sanitize input. If valid, split at colon
  if (regexDuration.test(inputVar)) {
    if (inputVar.indexOf('.') !== -1) { splitChar = '.'};
    inputArr = inputVar.split(splitChar);
  } else {
    return;
  };
  
  // no splitChar: treat input as hours
  if (inputArr.length == 1) {
      hours = inputArr[0] ? parseInt(inputArr[0]) : 0;
  };
  
  // one splitChar -> treat input as hh:mm
  if (inputArr.length == 2) {
      hours = inputArr[0] ? parseInt(inputArr[0]) : 0;
      minutes = inputArr[1] ? parseInt(inputArr[1]) : 0;
  };
  
  // point as splitChar -> treat minutes as decimal
  if (splitChar == '.') {
    var decMinutes = Math.round(60 * parseFloat(hours+'.'+minutes));
    hours = Math.floor(decMinutes / 60);
    minutes = decMinutes % 60;
  }
  
  // Create a moment.js object (we don't use the duration object because it does not support formatted output)
  formDuration = moment('2018-01-01 '+hours+':'+minutes, 'YYYY-MM-DD HH:mm');        
  
  // Get the formatted date (or empty if invalid)
  output = formDuration.isValid() ? formDuration.format('HH:mm') : '';
  
  // Write output to field
  $(this).val(output);
  
  // Call validation to make invalid input visible
  $('#frm-timelog').form('validate field', 'duration');
});

// Sort function for tasks. Uses task.name to sort
function sortTasks(a, b) {
  return (a.name).localeCompare(b.name);
}