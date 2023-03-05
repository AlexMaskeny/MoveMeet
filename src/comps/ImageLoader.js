import React, { useCallback, useEffect, useState } from 'react';
import { ImageBackground, Image } from 'react-native';
import * as FileSystem from "expo-file-system";

import * as logger from '../functions/logger';

function ImageLoader({
    source = " ", //URI
    defaultSource = " ", //URI
    disabled = false,
    isBackground = false,
    cacheKey,
    children,
    ...otherProps
}) {
    const [uri, setUri] = useState(" ");
    const [cacheReady, setCacheReady] = useState(false);
    const [imageReady, setImageReady] = useState(false);
    const [lDisabled, setLDisabled] = useState(lDisabled);
    const LoadImage = useCallback(() => (
        <Image source={{ uri: defaultSource }} {...otherProps} />
    ), []);
    const LoadImageBackground = useCallback(() => (
        <ImageBackground source={{ uri: defaultSource }} {...otherProps}>{children}</ImageBackground>
    ), []);
    const onLoadEnd = () => {
        setImageReady(true)
    }
    useEffect(() => {
        const initializeCache = async () => {
            try {
                setCacheReady(false);

                //Remove .jpg file extension
                let key = cacheKey.substring(0,cacheKey.length-4);

                //Query to see if the image is cached
                const imageCached = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + key);
                if (imageCached.exists) {
                    setLDisabled(false);
                    setUri(FileSystem.cacheDirectory + key);
                } //If cached, set the URI to the local file and enable local imaging (disabled = false)
                else {
                    setLDisabled(true);
                    const cachedImage = await FileSystem.createDownloadResumable(source, FileSystem.cacheDirectory + key, {}, () => { });
                    await cachedImage.downloadAsync();
                    setUri(source);
                } //If not cached, cache it and set the URI to the remote source and disable local imaging (disabled = true)
            } catch (error) {
                logger.warn(error);
            } finally {
                setCacheReady(true);
            }
        }
        //If the key is long enough (AKA won't store empty images) and it was requested to be cacheable, then initializeCache
        if (!disabled && cacheKey?.length > 4) initializeCache();
        else setLDisabled(true); //Otherwise, disable remote imaging
    }, []);

    //Remotes use the URI state variable as source
    if (!isBackground && !lDisabled) return (<>
        {(!cacheReady) && <LoadImage />}
        {(cacheReady) && <Image onLoadEnd={onLoadEnd} source={{ uri: imageReady ? uri : defaultSource }}  {...otherProps} />}
    </>);
    if (isBackground && !lDisabled) return (<>
        {(!cacheReady) && <LoadImageBackground />}
        {(cacheReady) && <ImageBackground onLoadEnd={onLoadEnd} source={{ uri: imageReady ? uri : defaultSource }} {...otherProps}>{children}</ImageBackground>}
    </>);

    //Locals use the source parameter as source
    if (!isBackground && lDisabled) return <Image onLoadEnd={onLoadEnd} source={{ uri: imageReady ? source : defaultSource }}  {...otherProps} />
    if (isBackground && lDisabled) return <ImageBackground onLoadEnd={onLoadEnd} source={{ uri: imageReady ? source : defaultSource }}  {...otherProps}>{children}</ImageBackground>
}

export default ImageLoader;