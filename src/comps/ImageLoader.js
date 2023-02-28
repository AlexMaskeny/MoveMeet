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
    const LoadImage = useCallback(() => (
        <Image source={{ uri: defaultSource }} {...otherProps} />
    ), []);
    const LoadImageBackground = useCallback(() => (
        <ImageBackground source={{ uri: defaultSource }} {...otherProps}>{children}</ImageBackground>
    ), []);
    useEffect(() => {
        const initialFunction = async () => {
            try {
                setCacheReady(false);
                const imageCached = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + cacheKey);
                if (imageCached.exists) {
                    setUri(FileSystem.cacheDirectory + cacheKey);
                } else {
                    const cachedImage = await FileSystem.createDownloadResumable(source, FileSystem.cacheDirectory + cacheKey, {}, () => { });
                    const localUri = await cachedImage.downloadAsync();
                    if (localUri?.uri) {
                        setUri(localUri.uri);
                    } else throw "Invalid Uri response";
                }
            } catch (error) {
                logger.warn(error);
            } finally {
                setUri(source);
                setCacheReady(true);
            }
        };
        if (!disabled) initialFunction();
    }, []);

    if (!isBackground && !disabled) return (<>
        {(!cacheReady || !imageReady) && <LoadImage />}
        {(cacheReady && imageReady) && <Image onLoadEnd={()=>setImageReady(true)} source={{ uri: uri }} {...otherProps} />}
    </>);
    if (isBackground && !disabled) return (<>
        {(!cacheReady || !imageReady) && <LoadImageBackground />}
        {(cacheReady && imageReady) && <ImageBackground onLoadEnd={() => setImageReady(true)}  source={{ uri: uri }} {...otherProps}>{children}</ImageBackground>}
    </>);
    if (!isBackground && disabled) return <Image onLoadEnd={() => setImageReady(true)} source={{ uri: source }} {...otherProps} />
    if (isBackground && disabled) return <ImageBackground onLoadEnd={() => setImageReady(true)}  source={{ uri: source }} {...otherProps}>{children}</ImageBackground>
}

export default ImageLoader;