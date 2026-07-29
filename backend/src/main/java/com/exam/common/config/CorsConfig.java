package com.exam.common.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://172.16.8.10:30081");
        config.addAllowedOrigin("http://172.16.8.10:30080");
        config.addAllowedOrigin("http://172.16.8.11:30081");
        config.addAllowedOrigin("http://172.16.8.12:30081");
        config.addAllowedOrigin("http://172.16.8.11:30080");
        config.addAllowedOrigin("http://172.16.8.12:30080");
        config.addAllowedOrigin("http://bank-dev.local:31508");
        config.addAllowedOrigin("http://bank-prod.local:31508");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
