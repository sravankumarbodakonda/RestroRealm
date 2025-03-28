package com.letusbuild.restrorealm.config.filters;

import com.letusbuild.restrorealm.config.CustomGrantedAuthority;
import com.letusbuild.restrorealm.entity.Permission;
import com.letusbuild.restrorealm.entity.User;
import com.letusbuild.restrorealm.service.Impl.JwtServiceImpl;
import com.letusbuild.restrorealm.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtServiceImpl jwtService;
    private final UserService userService;
    private final ModelMapper modelMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        final String requestTokenHeader = request.getHeader("Authorization");
        if (requestTokenHeader == null || !requestTokenHeader.startsWith("Bearer")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = requestTokenHeader.split("Bearer ")[1];
        Long userId = jwtService.getUserIdFromToken(token);

        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userService.getUserEntityById(userId);
            Collection<CustomGrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new CustomGrantedAuthority("ROLE_" + user.getRole().getName().toUpperCase()));
            Set<Permission> permissions = user.getRole().getPermissions();
            if (permissions != null && !permissions.isEmpty()) {
                permissions.stream()
                        .map(permission -> new CustomGrantedAuthority(permission.getName()))
                        .forEach(authorities::add);
            }
            UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =
                    new UsernamePasswordAuthenticationToken(user, null, null);
            SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
        }
        filterChain.doFilter(request, response);
    }
}
