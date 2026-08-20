import React, { useEffect, useMemo } from 'react'
import { openURL } from 'minecraft-renderer/src/lib/simpleUtils'
import { useSnapshot } from 'valtio'
import { haveDirectoryPicker } from '../utils'
import { ConnectOptions } from '../connect'
import { miscUiState } from '../globalState'
import {
  isRemoteSplashText,
  loadRemoteSplashText,
  getCachedSplashText,
  cacheSplashText,
  cacheSourceUrl,
  clearSplashCache
} from '../utils/splashText'
import styles from './mainMenu.module.css'
import Button from './Button'
import ButtonWithTooltip from './ButtonWithTooltip'
import { pixelartIcons } from './PixelartIcon'
import useLongPress from './useLongPress'
import PauseLinkButtons from './PauseLinkButtons'
import CreditsBookButton from './CreditsBookButton'
import { withInjectableUi } from './extendableSystem'

type Action = (e: React.MouseEvent<HTMLButtonElement>) => void

interface Props {
  connectToServerAction?: Action
  singleplayerAction?: Action
  optionsAction?: Action
  githubAction?: Action
  openFileAction?: Action
  mapsProvider?: string
  versionStatus?: string
  versionTitle?: string
  onVersionStatusClick?: () => void
  bottomRightLinks?: string
  versionText?: string
  onVersionTextClick?: () => void
  singleplayerAvailable?: boolean
}

const httpsRegex = /^https?:\/\//

const MainMenuBase = ({
  connectToServerAction,
  mapsProvider,
  singleplayerAction,
  optionsAction,
  githubAction,
  openFileAction,
  singleplayerAvailable = true,
}: Props) => {
  const { appConfig } = useSnapshot(miscUiState)

  const splashText = useMemo(() => {
    const cachedText = getCachedSplashText()

    const configSplashFromApp = appConfig?.splashText
    const isRemote = configSplashFromApp && isRemoteSplashText(configSplashFromApp)
    const sourceKey = isRemote ? configSplashFromApp : (configSplashFromApp || '')
    const storedSourceKey = localStorage.getItem('minecraft_splash_url')

    if (storedSourceKey !== sourceKey) {
      clearSplashCache()
      cacheSourceUrl(sourceKey)
    } else if (cachedText) {
      return cachedText
    }

    if (!isRemote && configSplashFromApp && configSplashFromApp.trim() !== '') {
      cacheSplashText(configSplashFromApp)
      return configSplashFromApp
    }

    return appConfig?.splashTextFallback || ''
  }, [])

  useEffect(() => {
    const configSplashFromApp = appConfig?.splashText
    if (configSplashFromApp && isRemoteSplashText(configSplashFromApp)) {
      loadRemoteSplashText(configSplashFromApp)
        .then(fetchedText => {
          if (fetchedText && fetchedText.trim() !== '' && !fetchedText.includes('Failed to load')) {
            cacheSplashText(fetchedText)
          }
        })
        .catch(error => {
          console.error('Failed to preload splash text for next session:', error)
        })
    }
  }, [appConfig?.splashText])

  const singleplayerLongPress = useLongPress(
    () => {
      window.location.href = window.location.pathname + '?sp=1'
    },
    () => singleplayerAction?.(null as any),
    { delay: 500 }
  )

  const connectToServerLongPress = useLongPress(
    () => {
      if (process.env.NODE_ENV === 'development') {
        // Connect to <origin>:25565
        const origin = window.location.hostname
        const connectOptions: ConnectOptions = {
          server: `${origin}:25565`,
          username: 'test',
        }
        dispatchEvent(new CustomEvent('connect', { detail: connectOptions }))
      }
    },
    () => connectToServerAction?.(null as any),
    { delay: 500 }
  )

  return (
    <div className={styles.root}>
      <div className={styles['game-title']}>
        <div className={styles.minecraft}>
          <div className={styles.edition} />
          <span className={styles.splash}>{splashText}</span>
        </div>
      </div>

      <div className={styles.menu}>
        <ButtonWithTooltip
          initialTooltip={{
            content: 'Connect to Java servers!',
            placement: 'top',
          }}
          {...connectToServerLongPress}
          data-test-id='servers-screen-button'
        >
          Connect to server
        </ButtonWithTooltip>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <ButtonWithTooltip
            style={{ width: 150 }}
            {...singleplayerLongPress}
            data-test-id='singleplayer-button'
            disabled={!singleplayerAvailable}
            initialTooltip={{
              content: 'Create worlds and play offline',
              placement: 'left',
              offset: -40
            }}
          >
            Singleplayer
          </ButtonWithTooltip>

          <ButtonWithTooltip
            disabled={!mapsProvider}
            // className={styles['maps-provider']}
            icon={pixelartIcons.map}
            initialTooltip={{ content: 'Explore maps to play from provider!', placement: 'top-start' }}
            onClick={() => mapsProvider && openURL(httpsRegex.test(mapsProvider) ? mapsProvider : 'https://' + mapsProvider, false)}
          />

          <ButtonWithTooltip
            data-test-id='select-file-folder'
            icon={pixelartIcons.folder}
            onClick={openFileAction}
            initialTooltip={{
              content: 'Load any Java world save' + (haveDirectoryPicker() ? '' : ' (zip)!'),
              placement: 'bottom-start',
            }}
          />
        </div>
        <Button
          onClick={optionsAction}
        >
          Options
        </Button>
        <div className={styles['menu-row']}>
          <PauseLinkButtons />
        </div>
        <CreditsBookButton />
      </div>

    </div>
  )
}

export default withInjectableUi(MainMenuBase, 'mainMenu')
