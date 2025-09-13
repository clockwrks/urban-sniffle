import { Plugin, registerPlugin } from 'bunny/managers/plugins'
import { Patcher, DataStore, Webpack } from 'bunny'

const UserStore = Webpack.getStore('UserStore')
const UserProfileStore = Webpack.getStore('UserProfileStore')
const PresenceStore = Webpack.getStore('PresenceStore')
const GuildMemberStore = Webpack.getStore('GuildMemberStore')

interface ImposterSettings {
  active: boolean
  subjectUserId: string
  targetUserId: string
}

const defaultSettings: ImposterSettings = {
  active: true,
  subjectUserId: '',
  targetUserId: ''
}

let settings: ImposterSettings = Object.assign(
  {},
  defaultSettings,
  DataStore.get('ImposterSettings')
)

const Imposter: Plugin = {
  name: 'Imposter',
  version: '0.0.1',
  authors: [{ name: 'eeriemyxi', id: '598134630104825856' }],
  description: 'Impersonate someone as somebody else.',

  onStart() {
    this.loadPatches()
  },

  onStop() {
    Patcher.unpatchAll()
  },

  loadPatches() {
    if (!settings.active) return

    Patcher.after(UserStore, 'getUser', (_, args, res) => {
      if (res && res.id === settings.targetUserId) {
        const subjectUser = UserStore.getUser(settings.subjectUserId)
        if (!subjectUser) return res
        return { ...res, ...subjectUser }
      }
    })

    Patcher.after(UserProfileStore, 'getUserProfile', (_, args, res) => {
      if (res && res.userId === settings.targetUserId) {
        const subjectProfile = UserProfileStore.getUserProfile(settings.subjectUserId)
        if (!subjectProfile) return res
        return { ...res, ...subjectProfile }
      }
    })

    Patcher.after(UserProfileStore, 'getMutualGuilds', (_, args, res) => {
      if (args[0] === settings.targetUserId) {
        return UserProfileStore.getMutualGuilds(settings.subjectUserId) || res
      }
    })

    Patcher.after(PresenceStore, 'getPrimaryActivity', (_, args, res) => {
      if (args[0] === settings.targetUserId) {
        return PresenceStore.getPrimaryActivity(settings.subjectUserId) || res
      }
    })

    Patcher.after(GuildMemberStore, 'getMember', (_, args, res) => {
      if (args[1] === settings.targetUserId) {
        const subjectMember = GuildMemberStore.getMember(args[0], settings.subjectUserId)
        const subjectUser = UserStore.getUser(settings.subjectUserId)
        if (subjectMember || subjectUser) {
          return { ...res, nick: subjectMember?.nick ?? subjectUser.globalName }
        }
      }
    })
  }
}

registerPlugin(Imposter)
