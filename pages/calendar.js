import {Card, Layout, Page, ContextualSaveBar} from '@shopify/polaris';
import moment from 'moment'
import WeekCalendar from 'react-week-calendar';
import {Component, createRef} from 'react'
import 'react-week-calendar/dist/style.css';



export default class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false
    }
    this.editCalendar = createRef()
  }

  saveCalendar = (event) => {
    const ref = this.editCalendar.current
    const data = ref.state
    console.log(data)
    this.setState({edit: false})
  }

  render() {
    const style="body{overflow: hidden !important}.Polaris-Page--fullWidth{padding-right:0!important}.Polaris-Button--primary{margin-right:17px!important}.weekCalendar__overlay{width:100px!important}.event{background: linear-gradient(to bottom, #6371c7c4, #5563c1) !important;\n" +
      "    border-color: #3f4eae !important; color:white !important;text-align: center;}.customModal__button{background: linear-gradient(to bottom, #6371c7, #5563c1) !important;\n" +
      "    border-color: #3f4eae !important; color:white !important;text-align: center;}"
    const mainCalendar = <Page
      fullWidth
      title="Calendar"
      primaryAction={{content: 'Edit Schedule', onAction: () => this.setState({edit: true})}}
      secondaryActions={[]}
    >
      <style>{style}</style>
      <EditCalendar/>
    </Page>

    const editCalendar = <Page
      fullWidth
      title="Edit Calendar"
      primaryAction={{content: 'Save', onAction: this.saveCalendar}}
      secondaryActions={[{content: 'Discard changes', onAction: () => this.setState({edit: false})}]}
    >
      <style>{style}</style>

      <EditCalendar ref={this.editCalendar}/>
    </Page>

    const edit = this.state.edit
    return (
      edit ? editCalendar : mainCalendar
    )
  }
};

class EditCalendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lastUid: 0,
      selectedIntervals: [],
    }
  }

  handleEventRemove = (event) => {
    const {selectedIntervals} = this.state;
    const index = selectedIntervals.findIndex((interval) => interval.uid === event.uid);
    if (index > -1) {
      selectedIntervals.splice(index, 1);
      this.setState({selectedIntervals});
    }

  }

  handleEventUpdate = (event) => {
    const {selectedIntervals} = this.state;
    const index = selectedIntervals.findIndex((interval) => interval.uid === event.uid);
    if (index > -1) {
      selectedIntervals[index] = event;
      this.setState({selectedIntervals});
    }
  }

  handleSelect = (newIntervals) => {
    const {lastUid, selectedIntervals} = this.state;
    var alertcheck = true
    var intervals = newIntervals.map((interval, index) => {
      var check = false;
      selectedIntervals.map((selected, index) => {
          if (interval.start.isAfter(selected.start) && interval.start.isBefore(selected.end) || interval.end.isAfter(selected.start) && interval.end.isBefore(selected.end)) {
            if (alertcheck) {
              alert("Please don't add overlapping intervals")
              alertcheck = false
            }
            check = true;
          }
        }
      )
      return {
        ...interval,
        uid: lastUid + index,
        check: check,
        value: null
      }
    });
    intervals = intervals.reduce(function (result, interval) {
      if (!interval.check) {
        result.push(interval);
      }
      return result;
    }, []);
    this.setState({
      selectedIntervals: selectedIntervals.concat(intervals),
      lastUid: lastUid + intervals.length
    })
  }

  render() {
    return (
      <Layout>
        <Layout.Section title="calendar">
          <WeekCalendar startTime={moment({h: 0, m: 0})}
                        endTime={moment({h: 23, m: 45})}
                        numberOfDays={7}
                        selectedIntervals={this.state.selectedIntervals}
                        onIntervalSelect={this.handleSelect}
                        onIntervalUpdate={this.handleEventUpdate}
                        onIntervalRemove={this.handleEventRemove}
                        showModalCase={['edit']}
          />
        </Layout.Section>
      </Layout>
    )
  }

}

//MODULAR INTERVALS

/*

handleSelect = (newIntervals) => {
const {lastUid, selectedIntervals} = this.state;
var intervals = newIntervals.map((interval, index) => {
var check = false;
var start = interval.start
var end = interval.end
selectedIntervals.map((selected, index) => {
if (interval.start.isAfter(selected.start) && interval.start.isBefore(selected.end)) {
start = selected.end
}
if (interval.end.isAfter(selected.start) && interval.end.isBefore(selected.end)) {
end = selected.start
}
}
)
interval.start = start
interval.end = end
return {
...interval,
uid: lastUid + index,
check: check
}
});
intervals = intervals.reduce(function (result, interval) {
if (!interval.check) {
result.push(interval);
}
return result;
}, []);
this.setState({
selectedIntervals: selectedIntervals.concat(intervals),
lastUid: lastUid + intervals.length
})
console.log(this.state)
}

render() {
return (
<Layout>
<style>{"body{overflow: hidden !important}"}</style>
<Layout.Section title="calendar">
<WeekCalendar startTime={moment({h: 0, m: 0})}
endTime={moment({h: 23, m: 45})}
numberOfDays={7}
selectedIntervals={this.state.selectedIntervals}
onIntervalSelect={this.handleSelect}
onIntervalUpdate={this.handleEventUpdate}
onIntervalRemove={this.handleEventRemove}
showModalCase={['edit']}
eventSpacing={0}
/>
</Layout.Section>
</Layout>
)
}
};
*/
