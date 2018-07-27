import * as request from 'superagent'
import * as xml2jsparser from 'superagent-xml2jsparser'
import * as settingsStore from "settings-store"

settingsStore.init({
    appName: 'jira-activity',
    reverseDNS: 'de.ruettenm.jira-activity'
})

export interface JiraSettings {
    hostname: string
    username: string
    password: string
}

export interface ActivityEntry {
    id: string
    title: string
    date: string
}

export interface GroupedActivities {
    [ date: string ]: {
        [ issueKey: string ]: string
    }
}

export const getActivities = async (jiraSettings: JiraSettings, maxResults: number): Promise<GroupedActivities> => {
    const url = `activity?maxResults=${maxResults}&streams=user+IS+${encodeURIComponent(jiraSettings.username)}&os_authType=basic`
    const response = await requestWithCredentials(jiraSettings, url).buffer(true).parse(xml2jsparser)

    const activities = response.body.feed.entry.map((entry: any) => convertToActivityEntry(entry))

    const result: GroupedActivities = {}
    for (let activity of activities) {
        if (activity) {
            const parent = await getParentIssue(jiraSettings, activity)

            addToResult(result, parent || activity)
        }
    }

    return result
}
    
const getParentIssue = async (jiraSettings: JiraSettings, activity: ActivityEntry): Promise<ActivityEntry | undefined> => {
    const parentIssue = settingsStore.value(`issues.${activity.id}`)
    if (parentIssue) {
        return parentIssue
    }

    const parentIssueFromJira = await getParentIssueFromJira(jiraSettings, activity)
    if (parentIssueFromJira) {
        settingsStore.setValue(`issues.${activity.id}`, parentIssueFromJira)
        return parentIssueFromJira
    }

    return undefined
}

const getParentIssueFromJira = async (jiraSettings: JiraSettings, activity: ActivityEntry) => {
    const response = await requestWithCredentials(jiraSettings, `rest/api/2/issue/${activity.id}`)
    const parent = response.body.fields.parent

    if (parent) {
        return {
            id: parent.key,
            title: parent.fields.summary,
            date: activity.date
        }
    }

    return undefined
}

const convertToActivityEntry = (entry: any): ActivityEntry | undefined => {
    const activityEntry = entry['activity:object'][0]

    if (activityEntry && activityEntry.title && activityEntry.title[0] && activityEntry.summary && activityEntry.summary[0] && entry.published && entry.published[0]) {
        const title = activityEntry.title[0]['_']
        const summary = activityEntry.summary[0]['_']
        const published = entry.published[0].split('T')[0]

        return {
            id: title,
            title: summary,
            date: published
        }
    }

    return undefined
}

const addToResult = async (result: GroupedActivities, entry: ActivityEntry) => {
    if (!result.hasOwnProperty(entry.date)) {
        result[entry.date] = {}
    }

    if (!result[entry.date].hasOwnProperty(entry.id)) {
        result[entry.date][entry.id] = entry.title
    }
}

const requestWithCredentials = (jiraSettings: JiraSettings, path: string) => {
    return request
        .get(`https://${jiraSettings.hostname}/${path}`)
        .auth(jiraSettings.username, jiraSettings.password)
}
