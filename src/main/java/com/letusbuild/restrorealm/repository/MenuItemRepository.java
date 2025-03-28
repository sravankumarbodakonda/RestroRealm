package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategoryName(String categoryName);

    @Query("SELECT m FROM MenuItem m WHERE LOWER(m.category.name) = LOWER(:categoryName)")
    List<MenuItem> findByCategoryNameIgnoreCase(@Param("categoryName") String categoryName);

    @Query("SELECT m FROM MenuItem m WHERE " +
            "LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(m.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(m.category.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<MenuItem> searchByKeyword(@Param("keyword") String keyword);
}
