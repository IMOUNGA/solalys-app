import {Link} from "expo-router";
import {Pressable, Text, View} from "react-native";
import {IconSymbol} from "@/components/ui/icon-symbol";
import React from "react";

type SettingItemProps = {
    icon: string;
    title: string;
    href: string;
};

const SettingItem = ({icon, title, href}: SettingItemProps) => (
    <Link href={href} asChild>
        <Pressable className="flex-row items-center justify-between bg-white py-4 px-5 border-b border-gray-200 active:bg-gray-50">
            <View className="flex-row items-center gap-4">
                <IconSymbol name={icon} size={24} color="#000" />
                <Text className="text-base font-medium text-gray-900">{title}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
        </Pressable>
    </Link>
);

export default SettingItem;
