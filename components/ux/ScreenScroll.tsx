import React, {ReactNode} from 'react';
import {ScrollView, StyleProp, ViewStyle, KeyboardAvoidingView, Platform} from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context";

type Props = {
    children: ReactNode,
    className?: string,
    contentClassName?: string,
    style?: StyleProp<ViewStyle>,
    contentContainerStyle?: StyleProp<ViewStyle>,
    showsVerticalScrollIndicator?: boolean,
}
const ScreenScroll = ({
                          children,
                          className,
                          contentClassName,
                          style,
                          contentContainerStyle,
                          showsVerticalScrollIndicator = false,
                      }: Props) => {

    return (
        <SafeAreaView className={`px-5 ${className}`} edges={['top']} style={{flex: 1, backgroundColor: 'rgb(242, 242, 242)'}}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                <ScrollView
                    contentContainerClassName={contentClassName}
                    style={{backgroundColor: 'rgb(242, 242, 242)', ...(style as any)}}
                    contentContainerStyle={contentContainerStyle}
                    showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                    keyboardShouldPersistTaps="handled">
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ScreenScroll;
