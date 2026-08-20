import React, { useEffect, useMemo } from 'react'
import { useSnapshot } from 'valtio'
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
import { withInjectableUi } from './extendableSystem'

type Action = (e: React.MouseEvent<HTMLButtonElement>) => void

interface Props {
  joinZteppaAction?: Action
  optionsAction?: Action
}

const MainMenuBase = ({
  joinZteppaAction,
  optionsAction,
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
            content: 'Join the Zteppa SMP server',
            placement: 'top',
          }}
          onClick={joinZteppaAction}
          data-test-id='join-zteppa-button'
        >
          Join Zteppa
        </ButtonWithTooltip>
        <Button onClick={optionsAction}>
          Settings / Options
        </Button>
      </div>
    </div>
  )
}

export default withInjectableUi(MainMenuBase, 'mainMenu')
