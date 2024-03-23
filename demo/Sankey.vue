<template>
  <CloudFlowSankey :data="rawData" />
</template>

<script setup lang="ts">
import rawData from "./data.json";
import CloudFlowSankey from "../src/cloudFlowUtils/CloudFlowSankey.vue";
</script>

<style></style>
