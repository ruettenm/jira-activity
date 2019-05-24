import { GroupedActivities } from './jira'

export const print = (activities: GroupedActivities) => {
    for (let [ date, entries ] of Object.entries(activities).sort()) {
        console.log(`\n${date}:`)
        for (let [ issueKey, title ] of Object.entries(entries)) {
            console.log(`${issueKey} - ${title},`)
        }
    }
}
